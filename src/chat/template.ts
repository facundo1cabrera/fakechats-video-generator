export const chatTemplateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Screenshot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: transparent;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }

    .chat-container {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 920px;
      width: 100%;
      min-height: 200px;
    }

    .message {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.left {
      align-items: flex-start;
    }

    .message.right {
      align-items: flex-end;
    }

    .message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      line-height: 1.4;
      font-size: 16px;
    }

    .message.left .message-bubble {
      background: #e5e5ea;
      color: #000;
      border-bottom-left-radius: 4px;
    }

    .message.right .message-bubble {
      background: #007aff;
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .message-sender {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      padding: 0 4px;
    }

    .message.left .message-sender {
      text-align: left;
    }

    .message.right .message-sender {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="chat-container" id="chatContainer">
    <!-- Messages will be inserted here -->
  </div>

  <script>
    // Get data from window.chatData
    const chatData = window.chatData || {
      participants: [],
      messages: []
    };

    const container = document.getElementById('chatContainer');

    chatData.messages.forEach((msg, index) => {
      const participant = chatData.participants.find(p => p.id === msg.from);
      const isRight = msg.from === 'me' || (participant && participant.id === 'me');
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + (isRight ? 'right' : 'left');

      if (participant && !isRight) {
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        senderDiv.textContent = participant.name;
        messageDiv.appendChild(senderDiv);
      }

      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'message-bubble';
      bubbleDiv.textContent = msg.text;
      messageDiv.appendChild(bubbleDiv);

      container.appendChild(messageDiv);
    });
  </script>
</body>
</html>`;

