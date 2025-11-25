import { ValidationResult } from './types';
import { parseQueryString } from '../helpers';

// TODO refactor current validation and add tests
export function validateHysteria2Url(url: string): ValidationResult {
    if (!(url.startsWith('hysteria2://') || url.startsWith('hy2://'))) {
        return {
            valid: false,
            message: _('Invalid Hysteria2 URL: must start with hysteria2:// or hy2://'),
        };
    }

    try {
        if (!url || /\s/.test(url)) {
            return {
                valid: false,
                message: _('Invalid Hysteria2 URL: must not contain spaces'),
            };
        }

        // Extract the scheme
        const scheme = url.startsWith('hysteria2://') ? 'hysteria2://' : 'hy2://';

        // Get the body of the URL (everything after the scheme)
        const body = url.slice(scheme.length);

        // Split by # to separate fragment (if any)
        const [mainPart] = body.split('#');

        // Split by ? to separate main part from query parameters
        const [userHostPort, queryString] = mainPart.split('?');

        if (!userHostPort) {
            return {
                valid: false,
                message: _('Invalid Hysteria2 URL: missing host'),
            };
        }

        // Split by @ to separate auth part from host:port
        const [authPart, hostPortPart] = userHostPort.split('@');
        let hostname: string;
        let port: string;

        if (!hostPortPart) {
            // No auth part, everything is host:port
            const parts = authPart.split(':');
            hostname = parts[0];
            port = parts[1];
        } else {
            // Has auth part
            hostname = hostPortPart.split(':')[0];
            port = hostPortPart.split(':')[1];
        }

        // Check if server address is present
        if (!hostname) {
            return {
                valid: false,
                message: _('Invalid Hysteria2 URL: missing server address'),
            };
        }

        // Validate port if specified
        if (port) {
            const cleanedPort = port.replace('/', '');
            const portNum = parseInt(cleanedPort, 10);
            if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                return {
                    valid: false,
                    message: _('Invalid port number. Must be between 1 and 65535'),
                };
            }
        }

        // Process query parameters if present
        if (queryString) {
            const params = parseQueryString(queryString);

            // Validate obfs if present
            if (params.obfs && params.obfs !== 'salamander') {
                return {
                    valid: false,
                    message: _('Invalid obfs type. Only "salamander" is supported'),
                };
            }

            if (params.obfs === 'salamander' && !params['obfs-password']) {
                return {
                    valid: false,
                    message: _('Missing obfs-password for salamander obfuscation'),
                };
            }

            // Validate insecure parameter
            if (params.insecure !== undefined) {
                const insecure = params.insecure;
                if (insecure !== '0' && insecure !== '1') {
                    return {
                        valid: false,
                        message: _('Invalid insecure value. Must be "0" or "1"'),
                    };
                }
            }

            // Validate pinSHA256 parameter
            if (params.pinSHA256 !== undefined) {
                const pinSHA256 = params.pinSHA256;
                if (!pinSHA256 || pinSHA256.length === 0) {
                    return {
                        valid: false,
                        message: _('pinSHA256 value cannot be empty'),
                    };
                }
            }

            // Validate sni parameter
            if (params.sni !== undefined) {
                const sni = params.sni;
                if (!sni || sni.length === 0) {
                    return {
                        valid: false,
                        message: _('SNI value cannot be empty'),
                    };
                }
            }
        }
    } catch (_e) {
        return {
            valid: false,
            message: _('Invalid Hysteria2 URL: parsing failed'),
        };
    }

    return { valid: true, message: _('Valid') };
}
