import { cleanDomainInput } from './validators.js';

const RDAP_REGISTRY_HINTS = [
  {
    pattern: /\.vn$/i,
    title: 'WHOIS Data Unavailable',
    hint: 'Some .vn domains are published through VNNIC WHOIS instead of rdap.org.',
  },
];

export function buildRdapNoDataState(domain) {
  const normalizedDomain = cleanDomainInput(domain) || domain;
  const registryHint = RDAP_REGISTRY_HINTS.find(({ pattern }) => pattern.test(normalizedDomain));

  if (registryHint) {
    return {
      title: registryHint.title,
      message: `No RDAP record was returned for ${normalizedDomain} from rdap.org. This TLD may publish registration data outside the provider used by CheckHub.`,
      hint: registryHint.hint,
    };
  }

  return {
    title: 'RDAP Record Not Found',
    message: `No RDAP record was returned for ${normalizedDomain}. The domain may be unregistered, or this TLD may not expose data through rdap.org.`,
    hint: null,
  };
}

export function buildDomainNotFoundState(domain) {
  const normalizedDomain = cleanDomainInput(domain) || domain;

  return {
    title: 'Domain Not Found',
    message: `No WHOIS record was found for ${normalizedDomain}. The domain may not be registered.`,
    hint: null,
  };
}

export function buildWhoisUnavailableState(domain, provider = null) {
  const normalizedDomain = cleanDomainInput(domain) || domain;

  if (provider === 'vnnic') {
    return {
      title: 'WHOIS Data Unavailable',
      message: `The official .vn WHOIS provider did not return a usable record for ${normalizedDomain}.`,
      hint: 'VNNIC may be temporarily unavailable. Try again in a moment.',
    };
  }

  return {
    title: 'WHOIS Data Unavailable',
    message: `WHOIS data is temporarily unavailable for ${normalizedDomain}.`,
    hint: 'Try again in a moment.',
  };
}
