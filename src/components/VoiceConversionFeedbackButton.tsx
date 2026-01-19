import React from 'react';

interface VoiceConversionFeedbackButtonProps {
  sourceFileName: string | null;
  targetVoice: string | null;
  region: string;
  audioData: ArrayBuffer | null;
}

export function VoiceConversionFeedbackButton({
  sourceFileName,
  targetVoice,
  region,
  audioData,
}: VoiceConversionFeedbackButtonProps) {
  const handleSendFeedback = async () => {
    try {
      const emailBody = `
Source File: ${sourceFileName || '[No file selected]'}
Target Voice: ${targetVoice || '[No voice selected]'}
Region: ${region}

${audioData ? 'Please find the converted audio file attached (downloaded separately).' : '[No conversion completed yet]'}
      `.trim();

      const subject = encodeURIComponent(
        `Azure Voice Conversion Feedback - ${targetVoice || 'No voice'}`
      );
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:ttsvoicefeedback@microsoft.com?subject=${subject}&body=${body}`;

      // Download audio if available
      if (audioData) {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversion-${targetVoice || 'output'}-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Open email client
      window.open(mailtoLink, '_blank');

      if (audioData) {
        alert('Audio file downloaded! Please attach it to your email before sending.');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Error preparing feedback. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSendFeedback}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
      title="Send feedback about voice conversion"
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
    </button>
  );
}
