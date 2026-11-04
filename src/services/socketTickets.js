const crypto = require("crypto");

const TICKET_TTL_MS = 60 * 1000;
const MAX_PENDING_TICKETS = 100;

function createSocketTickets(sessionStore) {
  const tickets = new Map();

  function hashTicket(ticket) {
    return crypto.createHash("sha256").update(ticket).digest("hex");
  }

  function getSession(sessionId) {
    return new Promise((resolve, reject) => {
      sessionStore.get(sessionId, (error, session) => {
        if (error) return reject(error);
        resolve(session);
      });
    });
  }

  function removeExpiredTickets() {
    const now = Date.now();

    for (const [hash, record] of tickets) {
      if (record.expiresAt <= now) tickets.delete(hash);
    }
  }

  return {
    issue(sessionId) {
      removeExpiredTickets();

      if (tickets.size >= MAX_PENDING_TICKETS) {
        throw new Error("Too many pending socket tickets");
      }

      const ticket = crypto.randomBytes(32).toString("base64url");

      tickets.set(hashTicket(ticket), {
        sessionId,
        expiresAt: Date.now() + TICKET_TTL_MS,
      });

      return {
        ticket,
        expiresIn: TICKET_TTL_MS / 1000,
      };
    },

    async consume(ticket) {
      if (typeof ticket !== "string" || ticket.length > 128) {
        return null;
      }

      removeExpiredTickets();

      const hash = hashTicket(ticket);
      const record = tickets.get(hash);

      if (!record) return null;

      // Delete before checking the session so the ticket cannot be reused.
      tickets.delete(hash);

      try {
        const session = await getSession(record.sessionId);

        if (!session || session.authenticated !== true) {
          return null;
        }

        return {
          sessionId: record.sessionId,
        };
      } catch {
        return null;
      }
    },

    invalidateSession(sessionId) {
      for (const [hash, record] of tickets) {
        if (record.sessionId === sessionId) tickets.delete(hash);
      }
    },
  };
}

module.exports = { createSocketTickets };
