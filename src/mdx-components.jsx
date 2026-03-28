import { Highlight, themes } from 'prism-react-renderer';

/* ── Callout ── */
export function Callout({ children, type = 'info' }) {
  return <div className={`wp-callout wp-callout-${type}`}>{children}</div>;
}

/* ── CodeBlock (syntax-highlighted + copy button) ── */
export function CodeBlock({ children, language = 'text', title }) {
  const code = typeof children === 'string' ? children.trim() : '';
  const langLabel = language || 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    const btn = document.querySelector('.wp-code-copy');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    }
  };

  return (
    <div className="wp-code-block">
      {(title || langLabel) && (
        <div className="wp-code-header">
          <span className="wp-code-lang">{title || langLabel}</span>
          <button className="wp-code-copy" onClick={handleCopy}>Copy</button>
        </div>
      )}
      <Highlight theme={themes.nightOwl} code={code} language={langLabel}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={{ ...style, margin: 0, padding: '20px 24px', background: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

/* ── ComparisonTable ── */
export function ComparisonTable({ headers, rows, highlightLast = true }) {
  return (
    <div className="wp-table-wrap">
      <table className="wp-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={highlightLast && i === rows.length - 1 ? 'wp-highlight-row' : ''}>
              {row.map((cell, j) => (
                <td key={j} className={
                  highlightLast && j === 0 && i === rows.length - 1 ? 'wp-highlight-cell' : ''
                }>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── RefList ── */
export function RefList({ items }) {
  return (
    <div className="wp-ref-list">
      {items.map((ref, i) => (
        <div key={i} className="wp-ref">{ref}</div>
      ))}
    </div>
  );
}

/* ── MDX component overrides ── */
export const mdxComponents = {
  Callout,
  CodeBlock,
  ComparisonTable,
  RefList,
};
