import React, { useState } from 'react';

interface FeedbackButtonProps {
  text: string;
  selectedVoice: string;
  region: string;
  audioData: ArrayBuffer | null;
}

export function FeedbackButton({ text, selectedVoice, region, audioData }: FeedbackButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const generateSSML = () => {
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${selectedVoice}">
    ${text}
  </voice>
</speak>`;
  };

  const handleEmailWithDownload = async () => {
    try {
      const ssml = generateSSML();

      // Create email body
      const emailBody = `
Voice: ${selectedVoice}
Region: ${region}

SSML:
${ssml}

Text:
${text}

${audioData ? 'Please find the audio file attached (downloaded separately).' : '[No audio generated yet]'}
      `.trim();

      // Create mailto link
      const subject = encodeURIComponent(`Azure Voice Playground Feedback - ${selectedVoice}`);
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:ttsvoicefeedback@microsoft.com?subject=${subject}&body=${body}`;

      // Download audio if available
      if (audioData) {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback-${selectedVoice}-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Copy SSML to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(ssml);
      }

      // Open email client
      window.open(mailtoLink, '_blank');

      if (audioData) {
        alert('✅ Audio file downloaded!\n\nPlease attach it to your email manually before sending.');
      }

      setShowMenu(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Error preparing feedback. Please try again.');
    }
  };

  const handleDownloadPackage = async () => {
    try {
      const ssml = generateSSML();

      // Create a text file with feedback info
      const feedbackText = `Azure Voice Playground Feedback
================================

Voice: ${selectedVoice}
Region: ${region}
Date: ${new Date().toISOString()}

SSML:
${ssml}

Text:
${text}
`;

      // Download feedback text file
      const textBlob = new Blob([feedbackText], { type: 'text/plain' });
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `feedback-${selectedVoice}-${Date.now()}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      URL.revokeObjectURL(textUrl);

      // Download audio if available
      if (audioData) {
        const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioLink = document.createElement('a');
        audioLink.href = audioUrl;
        audioLink.download = `feedback-${selectedVoice}-${Date.now()}.mp3`;
        document.body.appendChild(audioLink);
        audioLink.click();
        document.body.removeChild(audioLink);
        URL.revokeObjectURL(audioUrl);

        alert('✅ Feedback package downloaded!\n\nFiles saved:\n- Feedback text file (.txt)\n- Audio file (.mp3)\n\nYou can now attach both files to your email.');
      } else {
        alert('✅ Feedback text file downloaded!\n\nNote: No audio has been generated yet.');
      }

      setShowMenu(false);
    } catch (error) {
      console.error('Error downloading package:', error);
      alert('Error creating feedback package. Please try again.');
    }
  };

  const handleCopyAll = async () => {
    try {
      const ssml = generateSSML();
      const feedbackText = `Voice: ${selectedVoice}
Region: ${region}

SSML:
${ssml}

Text:
${text}`;

      await navigator.clipboard.writeText(feedbackText);
      alert('✅ Feedback copied to clipboard!\n\nYou can paste it into your email.');
      setShowMenu(false);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error copying to clipboard. Please try again.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
        title="Send feedback with SSML and audio"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        Send Feedback
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            <div className="p-2">
              <button
                onClick={handleEmailWithDownload}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-md transition-colors flex items-start gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <div>
                  <div className="font-medium text-sm text-gray-900">Open Email + Download Audio</div>
                  <div className="text-xs text-gray-500 mt-0.5">Opens email client and downloads audio file</div>
                </div>
              </button>

              <button
                onClick={handleDownloadPackage}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-md transition-colors flex items-start gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-medium text-sm text-gray-900">Download Feedback Package</div>
                  <div className="text-xs text-gray-500 mt-0.5">Downloads text + audio files separately</div>
                </div>
              </button>

              <button
                onClick={handleCopyAll}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-md transition-colors flex items-start gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                <div>
                  <div className="font-medium text-sm text-gray-900">Copy to Clipboard</div>
                  <div className="text-xs text-gray-500 mt-0.5">Copy feedback text only</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
