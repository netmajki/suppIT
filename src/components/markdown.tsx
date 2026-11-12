import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Bezpieczne renderowanie Markdown (surowy HTML jest ignorowany). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} {...(href?.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
