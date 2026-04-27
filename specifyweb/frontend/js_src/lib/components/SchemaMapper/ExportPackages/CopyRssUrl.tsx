import React from 'react';

import { Button } from '../../Atoms/Button';

export function CopyRssUrl(): JSX.Element {
  const [copied, setCopied] = React.useState(false);
  const rssUrl = `${window.location.origin}/export/rss/`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rssUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button.Small onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy RSS Feed URL'}
    </Button.Small>
  );
}
