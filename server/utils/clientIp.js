/**
 * Resolves the real client IP for a request.
 *
 * In production the app sits behind at least one proxy on the same host
 * (nginx), and often two (a Cloudflare Tunnel in front of it). Without help,
 * `req.socket.remoteAddress` is always 127.0.0.1, which would put every visitor
 * in the same rate-limit bucket and write 127.0.0.1 into every audit log row.
 *
 * Order of preference:
 *   1. CF-Connecting-IP  — a single address Cloudflare sets, no list to parse
 *   2. req.ip            — Express resolves this from X-Forwarded-For once
 *                          `trust proxy` is configured (see server.js)
 *   3. the socket address — direct connections with no proxy in between
 */

// ip_address is VARCHAR(45), the longest an IPv6 address can be.
const MAX_LENGTH = 45;

function normalize(value) {
  if (!value) return null;
  let ip = String(value).trim();
  if (!ip) return null;

  // X-Forwarded-For may be a list; the client is the first entry.
  if (ip.includes(',')) ip = ip.split(',')[0].trim();

  // Express reports IPv4 over an IPv6 socket as ::ffff:1.2.3.4
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);

  if (!ip || ip.length > MAX_LENGTH) return null;
  return ip;
}

function getClientIp(req) {
  return (
    normalize(req.headers['cf-connecting-ip']) ||
    normalize(req.ip) ||
    normalize(req.socket && req.socket.remoteAddress) ||
    '127.0.0.1'
  );
}

module.exports = { getClientIp };
