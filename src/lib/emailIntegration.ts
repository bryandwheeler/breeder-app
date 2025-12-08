// Email Integration Service
// Handles OAuth and email syncing for Gmail and Outlook
// Multi-user setup: Each user provides their own OAuth credentials

import { EmailMessage, EmailDraft, EmailIntegration, OAuthCredentials } from '@/types/email';

// OAuth URLs (same for all users)
export const OAUTH_URLS = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  outlook: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
};

/**
 * Initiate Gmail OAuth flow
 */
export function initiateGmailAuth() {
  const params = new URLSearchParams({
    client_id: GMAIL_CONFIG.clientId,
    redirect_uri: GMAIL_CONFIG.redirectUri,
    response_type: 'code',
    scope: GMAIL_CONFIG.scope,
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `${GMAIL_CONFIG.authUrl}?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Initiate Outlook OAuth flow
 */
export function initiateOutlookAuth() {
  const params = new URLSearchParams({
    client_id: OUTLOOK_CONFIG.clientId,
    redirect_uri: OUTLOOK_CONFIG.redirectUri,
    response_type: 'code',
    scope: OUTLOOK_CONFIG.scope,
  });

  const authUrl = `${OUTLOOK_CONFIG.authUrl}?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Exchange authorization code for tokens (Gmail)
 */
export async function exchangeGmailCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(GMAIL_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GMAIL_CONFIG.clientId,
      client_secret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || '',
      redirect_uri: GMAIL_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

/**
 * Refresh Gmail access token
 */
export async function refreshGmailToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch(GMAIL_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GMAIL_CONFIG.clientId,
      client_secret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

/**
 * Fetch Gmail messages
 */
export async function fetchGmailMessages(
  accessToken: string,
  options: {
    maxResults?: number;
    query?: string;
    pageToken?: string;
  } = {}
): Promise<{ messages: any[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    maxResults: (options.maxResults || 50).toString(),
    ...(options.query && { q: options.query }),
    ...(options.pageToken && { pageToken: options.pageToken }),
  });

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail messages');
  }

  return response.json();
}

/**
 * Get Gmail message details
 */
export async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<any> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail message');
  }

  return response.json();
}

/**
 * Send email via Gmail
 */
export async function sendGmailMessage(
  accessToken: string,
  draft: EmailDraft
): Promise<any> {
  // Create RFC 2822 formatted message
  const message = createRFC2822Message(draft);
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
        ...(draft.threadId && { threadId: draft.threadId }),
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
}

/**
 * Parse Gmail message to EmailMessage format
 */
export function parseGmailMessage(gmailMessage: any): Partial<EmailMessage> {
  const headers = gmailMessage.payload.headers;
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const from = parseEmailAddress(getHeader('From'));
  const to = parseEmailAddresses(getHeader('To'));
  const cc = parseEmailAddresses(getHeader('Cc'));
  const subject = getHeader('Subject');
  const date = new Date(parseInt(gmailMessage.internalDate)).toISOString();

  // Extract body
  const { text, html } = extractGmailBody(gmailMessage.payload);

  return {
    messageId: gmailMessage.id,
    threadId: gmailMessage.threadId,
    from,
    to,
    cc: cc.length > 0 ? cc : undefined,
    subject,
    bodyText: text,
    bodyHtml: html,
    date,
    isRead: !gmailMessage.labelIds?.includes('UNREAD'),
    hasAttachments: gmailMessage.payload.parts?.some(
      (part: any) => part.filename && part.filename.length > 0
    ) || false,
    provider: 'gmail',
  };
}

/**
 * Helper: Parse email address from string
 */
function parseEmailAddress(str: string): { name?: string; email: string } {
  const match = str.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: str.trim() };
}

/**
 * Helper: Parse multiple email addresses
 */
function parseEmailAddresses(str: string): { name?: string; email: string }[] {
  if (!str) return [];
  return str.split(',').map(parseEmailAddress);
}

/**
 * Helper: Extract body from Gmail message payload
 */
function extractGmailBody(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (payload.body.data) {
    const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    if (payload.mimeType === 'text/plain') {
      text = decoded;
    } else if (payload.mimeType === 'text/html') {
      html = decoded;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        text = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (part.mimeType === 'text/html' && part.body.data) {
        html = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (part.parts) {
        const nested = extractGmailBody(part);
        text = text || nested.text;
        html = html || nested.html;
      }
    }
  }

  return { text, html };
}

/**
 * Helper: Create RFC 2822 formatted email message
 */
function createRFC2822Message(draft: EmailDraft): string {
  const lines: string[] = [];

  lines.push(`To: ${draft.to.join(', ')}`);
  if (draft.cc && draft.cc.length > 0) {
    lines.push(`Cc: ${draft.cc.join(', ')}`);
  }
  if (draft.bcc && draft.bcc.length > 0) {
    lines.push(`Bcc: ${draft.bcc.join(', ')}`);
  }
  lines.push(`Subject: ${draft.subject}`);
  if (draft.inReplyTo) {
    lines.push(`In-Reply-To: ${draft.inReplyTo}`);
    lines.push(`References: ${draft.inReplyTo}`);
  }
  lines.push('MIME-Version: 1.0');
  lines.push('Content-Type: text/html; charset=UTF-8');
  lines.push('Content-Transfer-Encoding: 7bit');
  lines.push('');
  lines.push(draft.htmlBody || draft.body.replace(/\n/g, '<br>'));

  return lines.join('\r\n');
}

/**
 * Match email to customer by email address
 */
export function findCustomerByEmail(
  email: string,
  customers: any[]
): any | null {
  const normalizedEmail = email.toLowerCase().trim();
  return customers.find(
    (c) => c.email.toLowerCase().trim() === normalizedEmail
  ) || null;
}
