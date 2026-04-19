import http from 'node:http';
import https from 'node:https';

import { LOCAL_HOST_ERROR, resolvePublicTarget } from './_lib/network.js';

const REQUEST_TIMEOUT_MS = 10000;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
}

async function requestStatus(targetUrl, method = 'HEAD', redirectCount = 0) {
  if (redirectCount > 5) {
    throw new Error('Too many redirects');
  }

  const resolvedTarget = await resolvePublicTarget(targetUrl.hostname);
  const transport = targetUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || undefined,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        method,
        servername: targetUrl.hostname,
        headers: {
          'User-Agent': 'CheckHub Website Status Checker',
          Accept: '*/*',
        },
        lookup(_hostname, _options, callback) {
          if (_options?.all) {
            callback(null, [{ address: resolvedTarget.address, family: resolvedTarget.family }]);
            return;
          }

          callback(null, resolvedTarget.address, resolvedTarget.family);
        },
      },
      async (response) => {
        response.resume();
        response.once('end', async () => {
          const statusCode = response.statusCode || 0;
          const statusText = response.statusMessage || '';

          if (REDIRECT_STATUS_CODES.has(statusCode) && response.headers.location) {
            try {
              const redirectedUrl = new URL(response.headers.location, targetUrl);
              const redirectedResult = await requestStatus(redirectedUrl, method, redirectCount + 1);
              resolve(redirectedResult);
            } catch (error) {
              reject(error);
            }
            return;
          }

          if (method === 'HEAD' && (statusCode === 405 || statusCode === 501)) {
            try {
              const fallbackResult = await requestStatus(targetUrl, 'GET', redirectCount);
              resolve(fallbackResult);
            } catch (error) {
              reject(error);
            }
            return;
          }

          resolve({
            statusCode,
            statusText,
            finalUrl: targetUrl.toString(),
            method,
          });
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error('Request timed out (>10s)'));
    });

    request.on('error', reject);
    request.end();
  });
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are supported' });
  }

  if (targetUrl.username || targetUrl.password) {
    return res.status(400).json({ error: 'Authenticated URLs are not supported' });
  }

  const startedAt = performance.now();

  try {
    const result = await requestStatus(targetUrl);
    return res.status(200).json({
      reachable: true,
      statusCode: result.statusCode,
      statusText: result.statusText,
      finalUrl: result.finalUrl,
      method: result.method,
      responseTime: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    if (error.message === LOCAL_HOST_ERROR || error.message === 'Could not resolve host') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      reachable: false,
      error: error.message || 'Could not reach target',
      timedOut: error.message === 'Request timed out (>10s)',
      responseTime: Math.round(performance.now() - startedAt),
    });
  }
}
