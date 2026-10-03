import React from 'react'

// Renders a news post written in simple Markdown as styled React elements.
// Supported: # / ## / ### headings, paragraphs (single line breaks kept),
// - / * bullet lists, 1. numbered lists, > quotes, --- dividers,
// **bold**, *italic*, `code` and [links](https://…).
// Everything becomes React elements — raw HTML in a post is shown as text,
// never injected, so content can't run scripts.

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g
const SAFE_URL = /^(https?:\/\/|mailto:|\/)/i

function renderInline(text, keyBase) {
    const out = []
    let last = 0
    let m
    let i = 0
    const re = new RegExp(INLINE.source, 'g') // own instance: recursion must not share lastIndex
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index))
        const key = `${keyBase}-${i++}`
        if (m[1] !== undefined) {
            out.push(<strong key={key} className="font-bold text-white">{renderInline(m[1], key)}</strong>)
        } else if (m[2] !== undefined) {
            out.push(<em key={key} className="italic text-neutral-200">{renderInline(m[2], key)}</em>)
        } else if (m[3] !== undefined) {
            out.push(
                <code key={key} className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-yellow-500 text-[0.9em] font-mono">
                    {m[3]}
                </code>
            )
        } else if (SAFE_URL.test(m[5])) {
            const external = /^https?:/i.test(m[5])
            out.push(
                <a
                    key={key}
                    href={m[5]}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-yellow-500 underline decoration-yellow-600/40 underline-offset-4 hover:decoration-yellow-500 transition-colors"
                >
                    {renderInline(m[4], key)}
                </a>
            )
        } else {
            out.push(m[0]) // unsafe link target: keep the raw text
        }
        last = re.lastIndex
    }
    if (last < text.length) out.push(text.slice(last))
    return out
}

function parseBlocks(source) {
    const lines = source.replace(/\\n/g, '\n').replace(/\r\n?/g, '\n').split('\n')
    const blocks = []
    let para = null
    let list = null
    let quote = null

    const flush = () => {
        if (para) blocks.push({ type: 'p', lines: para })
        if (list) blocks.push(list)
        if (quote) blocks.push({ type: 'quote', lines: quote })
        para = list = quote = null
    }

    for (const raw of lines) {
        const line = raw.trimEnd()
        let m
        if (!line.trim()) { flush(); continue }
        if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); blocks.push({ type: 'hr' }); continue }
        if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flush(); blocks.push({ type: 'h', level: m[1].length, text: m[2] }); continue }
        if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
            if (!list || list.type !== 'ul') { flush(); list = { type: 'ul', items: [] } }
            list.items.push(m[1]); continue
        }
        if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
            if (!list || list.type !== 'ol') { flush(); list = { type: 'ol', items: [] } }
            list.items.push(m[1]); continue
        }
        if ((m = line.match(/^>\s?(.*)$/))) {
            if (!quote) { flush(); quote = [] }
            quote.push(m[1]); continue
        }
        if (list || quote) flush()
        if (!para) para = []
        para.push(line.trim())
    }
    flush()
    return blocks
}

function withBreaks(lines, keyBase) {
    return lines.flatMap((l, i) => (i === 0 ? renderInline(l, `${keyBase}-${i}`) : [<br key={`${keyBase}-br${i}`} />, ...renderInline(l, `${keyBase}-${i}`)]))
}

// alignLeft: on wide screens keep the text against the left edge (used beside a
// portrait cover) instead of centring it
export default function PostContent({ content, alignLeft = false }) {
    if (!content) return null
    const blocks = parseBlocks(content)

    return (
        <div className={`max-w-2xl mx-auto ${alignLeft ? 'lg:mx-0' : ''} text-neutral-300 text-base md:text-[17px] leading-8 font-sans`}>
            {blocks.map((b, i) => {
                const key = `b${i}`
                switch (b.type) {
                    case 'h':
                        if (b.level === 1) {
                            return (
                                <h2 key={key} className="mt-12 mb-5 text-2xl md:text-3xl font-black uppercase tracking-wide text-white">
                                    {renderInline(b.text, key)}
                                </h2>
                            )
                        }
                        if (b.level === 2) {
                            return (
                                <h3 key={key} className="mt-12 mb-4 flex items-center gap-3 text-lg md:text-xl font-black uppercase tracking-[0.12em] text-white">
                                    <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-yellow-500 to-yellow-700 shrink-0" />
                                    <span>{renderInline(b.text, key)}</span>
                                </h3>
                            )
                        }
                        return (
                            <h4 key={key} className="mt-8 mb-3 text-sm md:text-base font-bold uppercase tracking-[0.15em] text-yellow-500">
                                {renderInline(b.text, key)}
                            </h4>
                        )
                    case 'ul':
                        return (
                            <ul key={key} className="my-6 space-y-2.5">
                                {b.items.map((item, j) => (
                                    <li key={`${key}-${j}`} className="flex gap-3">
                                        <span className="mt-[0.7em] w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                        <span>{renderInline(item, `${key}-${j}`)}</span>
                                    </li>
                                ))}
                            </ul>
                        )
                    case 'ol':
                        return (
                            <ol key={key} className="my-6 space-y-2.5">
                                {b.items.map((item, j) => (
                                    <li key={`${key}-${j}`} className="flex gap-3">
                                        <span className="mt-[0.15em] min-w-[1.75rem] h-7 rounded-lg bg-yellow-600/15 border border-yellow-600/30 text-yellow-500 text-xs font-black flex items-center justify-center shrink-0">
                                            {j + 1}
                                        </span>
                                        <span>{renderInline(item, `${key}-${j}`)}</span>
                                    </li>
                                ))}
                            </ol>
                        )
                    case 'quote':
                        return (
                            <blockquote key={key} className="my-8 pl-5 py-1 border-l-2 border-yellow-600 text-neutral-200 italic">
                                {withBreaks(b.lines, key)}
                            </blockquote>
                        )
                    case 'hr':
                        return (
                            <div key={key} className="my-14 flex items-center gap-4" role="separator">
                                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-700 to-neutral-700" />
                                <span className="w-2 h-2 rotate-45 bg-yellow-600" />
                                <span className="flex-1 h-px bg-gradient-to-l from-transparent via-neutral-700 to-neutral-700" />
                            </div>
                        )
                    default:
                        return (
                            <p key={key} className="my-5">
                                {withBreaks(b.lines, key)}
                            </p>
                        )
                }
            })}
        </div>
    )
}
