"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`lesson-content ${className}`}>
      <ReactMarkdown
        components={{
          // ── Code blocks with syntax highlighting ──────────────────────────
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = !props.inline && match;
            if (isBlock) {
              return (
                <SyntaxHighlighter
                  style={oneLight as any}
                  language={match![1]}
                  PreTag="div"
                  className="!rounded-lg !text-sm !my-4 !border !border-border"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className="bg-muted text-primary font-mono text-[0.85em] px-1.5 py-0.5 rounded" {...props}>
                {children}
              </code>
            );
          },

          // ── Headings ──────────────────────────────────────────────────────
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 pb-2 border-b">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mt-7 mb-3 pb-1.5 border-b border-border/60">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mt-4 mb-1.5 uppercase tracking-wide text-muted-foreground">{children}</h4>
          ),

          // ── Paragraph ─────────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="text-[15px] text-foreground/90 leading-7 mb-4">{children}</p>
          ),

          // ── Lists ─────────────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-6 mb-4 space-y-1.5 text-[15px] text-foreground/90 leading-7">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-6 mb-4 space-y-1.5 text-[15px] text-foreground/90 leading-7">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,

          // ── Blockquote ────────────────────────────────────────────────────
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-1 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // ── Bold & italic ─────────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/80">{children}</em>
          ),

          // ── Table ─────────────────────────────────────────────────────────
          table: ({ children }) => (
            <div className="overflow-x-auto my-5 rounded-lg border border-border">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70 text-foreground font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left font-medium text-sm border-b border-border">{children}</th>
          ),
          td: ({ children }) => <td className="px-4 py-2.5 text-foreground/80">{children}</td>,

          // ── Horizontal rule ───────────────────────────────────────────────
          hr: () => <hr className="my-6 border-border" />,

          // ── Images ────────────────────────────────────────────────────────
          img: ({ src, alt }) => (
            <figure className="my-5">
              <img
                src={src}
                alt={alt || ""}
                className="rounded-lg w-full object-cover max-h-72 border border-border"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              {alt && (
                <figcaption className="text-center text-xs text-muted-foreground mt-2 italic">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // ── Links ─────────────────────────────────────────────────────────
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
