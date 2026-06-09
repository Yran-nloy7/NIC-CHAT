import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safety
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Props {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: Props) {
  const html = useMemo(() => {
    if (!content) return '';
    const raw = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6','p','br','strong','em','del',
        'ul','ol','li','a','code','pre','blockquote','table','thead',
        'tbody','tr','th','td','img','span','hr',
      ],
      ALLOWED_ATTR: ['href','src','alt','class','target','rel'],
    });
  }, [content]);

  return (
    <div
      className={`prose prose-invert prose-sm max-w-none [&_pre]:bg-gray-900 [&_pre]:rounded-lg [&_pre]:p-4 [&_code]:text-pink-400 [&_table]:w-full [&_th]:border [&_th]:border-gray-700 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-gray-700 [&_td]:px-3 [&_td]:py-2 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
