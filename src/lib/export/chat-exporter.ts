import { ChatData, ParsedMessage, MediaFile } from '@/types/chat';
import JSZip from 'jszip';

export type ExportFormat = 'txt' | 'json' | 'html' | 'pdf';

export interface ExportOptions {
  selectedMessageIds?: Set<string>;
  includeMedia?: boolean;
}

function formatMessageTimestamp(date: Date): string {
  return date.toLocaleString();
}

export function exportToTXT(chatData: ChatData, options: ExportOptions = {}): string {
  const { selectedMessageIds, includeMedia = false } = options;

  let messages = chatData.messages;
  if (selectedMessageIds && selectedMessageIds.size > 0) {
    messages = messages.filter(msg => selectedMessageIds.has(msg.id));
  }

  let output = `${chatData.chatName}\n`;
  output += `${'='.repeat(50)}\n\n`;

  let currentDate: string | null = null;

  for (const msg of messages) {
    const msgDate = msg.timestamp.toDateString();

    if (msgDate !== currentDate) {
      output += `\n[${msg.timestamp.toLocaleDateString()}]\n`;
      currentDate = msgDate;
    }

    const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (msg.type === 'system') {
      output += `${time} - ${msg.content}\n`;
    } else if (msg.type === 'deleted') {
      output += `${time} - ${msg.sender}: [This message was deleted]\n`;
    } else {
      let content = msg.content;

      if (msg.mediaFile && includeMedia) {
        content = `${content} [Media: ${msg.mediaFile.name}]`;
      } else if (msg.type !== 'text') {
        content = `[${msg.type}: ${msg.content || msg.mediaFile?.name || 'Media omitted'}]`;
      }

      output += `${time} - ${msg.sender}: ${content}\n`;
    }
  }

  return output;
}

export function exportToJSON(chatData: ChatData, options: ExportOptions = {}): string {
  const { selectedMessageIds, includeMedia = false } = options;

  let messages = chatData.messages;
  if (selectedMessageIds && selectedMessageIds.size > 0) {
    messages = messages.filter(msg => selectedMessageIds.has(msg.id));
  }

  const exportData = {
    chatName: chatData.chatName,
    participants: chatData.participants,
    startDate: chatData.startDate?.toISOString() || null,
    endDate: chatData.endDate?.toISOString() || null,
    messageCount: messages.length,
    messages: messages.map(msg => ({
      id: msg.id,
      timestamp: msg.timestamp.toISOString(),
      sender: msg.sender,
      content: msg.content,
      type: msg.type,
      isOutgoing: msg.isOutgoing,
      mediaFile: includeMedia && msg.mediaFile ? {
        name: msg.mediaFile.name,
        type: msg.mediaFile.type,
        url: msg.mediaFile.url,
      } : undefined,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

export function exportToHTML(chatData: ChatData, options: ExportOptions = {}): string {
  const { selectedMessageIds, includeMedia = false } = options;

  let messages = chatData.messages;
  if (selectedMessageIds && selectedMessageIds.size > 0) {
    messages = messages.filter(msg => selectedMessageIds.has(msg.id));
  }

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chatData.chatName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #333;
    }
    .header p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .messages {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .date-separator {
      text-align: center;
      margin: 20px 0;
      color: #999;
      font-size: 12px;
      font-weight: 500;
    }
    .message {
      margin: 10px 0;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 70%;
    }
    .message.outgoing {
      background: #dcf8c6;
      margin-left: auto;
      text-align: right;
    }
    .message.incoming {
      background: #ffffff;
      border: 1px solid #e5e5e5;
    }
    .message.system {
      text-align: center;
      background: #f0f0f0;
      margin: 10px auto;
      max-width: 80%;
      font-size: 12px;
      color: #666;
    }
    .sender {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 4px;
      color: #666;
    }
    .content {
      word-wrap: break-word;
      line-height: 1.4;
    }
    .timestamp {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }
    .media {
      margin-top: 8px;
    }
    .media img {
      max-width: 100%;
      border-radius: 4px;
    }
    .media video {
      max-width: 100%;
      border-radius: 4px;
    }
    .deleted {
      font-style: italic;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${chatData.chatName}</h1>
    <p>Participants: ${chatData.participants.join(', ')}</p>
    <p>Total Messages: ${messages.length}</p>
    ${chatData.startDate ? `<p>Start Date: ${chatData.startDate.toLocaleDateString()}</p>` : ''}
    ${chatData.endDate ? `<p>End Date: ${chatData.endDate.toLocaleDateString()}</p>` : ''}
  </div>
  <div class="messages">
`;

  let currentDate: string | null = null;

  for (const msg of messages) {
    const msgDate = msg.timestamp.toDateString();

    if (msgDate !== currentDate) {
      html += `    <div class="date-separator">${msg.timestamp.toLocaleDateString()}</div>\n`;
      currentDate = msgDate;
    }

    const messageClass = msg.type === 'system' ? 'system' : (msg.isOutgoing ? 'outgoing' : 'incoming');
    const timestamp = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    html += `    <div class="message ${messageClass}">\n`;

    if (msg.type !== 'system' && !msg.isOutgoing) {
      html += `      <div class="sender">${msg.sender}</div>\n`;
    }

    html += `      <div class="content">\n`;

    if (msg.type === 'deleted') {
      html += `        <span class="deleted">This message was deleted</span>\n`;
    } else if (msg.type === 'system') {
      html += `        ${msg.content}\n`;
    } else {
      // Escape HTML in content
      const escapedContent = msg.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      html += `        ${escapedContent}\n`;

      if (msg.mediaFile && includeMedia) {
        if (msg.type === 'image' && msg.mediaFile.url) {
          html += `        <div class="media"><img src="${msg.mediaFile.url}" alt="${msg.mediaFile.name}"></div>\n`;
        } else if (msg.type === 'video' && msg.mediaFile.url) {
          html += `        <div class="media"><video controls src="${msg.mediaFile.url}"></video></div>\n`;
        } else {
          html += `        <div class="media">[${msg.type}: ${msg.mediaFile.name}]</div>\n`;
        }
      } else if (msg.type !== 'text') {
        html += `        <div class="media">[${msg.type}: ${msg.content || msg.mediaFile?.name || 'Media omitted'}]</div>\n`;
      }
    }

    html += `      </div>\n`;
    html += `      <div class="timestamp">${timestamp}</div>\n`;
    html += `    </div>\n`;
  }

  html += `  </div>
</body>
</html>`;

  return html;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadZipFile(chatData: ChatData, exportContent: string, exportFilename: string, format: ExportFormat) {
  const zip = new JSZip();

  // Add the exported chat file
  zip.file(exportFilename, exportContent);

  // Get all unique media files from messages
  const mediaFilesSet = new Set<string>();
  for (const msg of chatData.messages) {
    if (msg.mediaFile) {
      mediaFilesSet.add(msg.mediaFile.name);
    }
  }

  // Add all media files to the ZIP
  for (const mediaFileName of mediaFilesSet) {
    const mediaFile = chatData.mediaFiles.get(mediaFileName);
    if (mediaFile && mediaFile.blob) {
      zip.file(mediaFileName, mediaFile.blob);
    }
  }

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const zipFilename = exportFilename.replace(/\.(txt|json|html|pdf)$/i, '.zip');
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(chatData: ChatData, options: ExportOptions = {}): void {
  // For PDF, we'll generate HTML and use browser's print functionality
  const html = exportToHTML(chatData, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 250);
  };
}
