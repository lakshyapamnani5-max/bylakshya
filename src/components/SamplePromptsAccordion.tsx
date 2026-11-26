import { useState } from 'react';
import { Check, Copy, Minus, Plus } from 'lucide-react';
import type { SamplePrompt } from '../types/cms';
import { isSafeUrl } from '../utils/skillsLogic';

interface SamplePromptsAccordionProps {
  prompts: SamplePrompt[];
}

export function SamplePromptsAccordion({ prompts }: SamplePromptsAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  if (prompts.length === 0) return null;

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopyPrompt = async (prompt: SamplePrompt) => {
    setCopyErrorId(null);
    let copied = false;

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(prompt.content);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = prompt.content;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setCopiedId(prompt.id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === prompt.id ? null : curr));
      }, 2200);
    } else {
      setCopyErrorId(prompt.id);
      setTimeout(() => {
        setCopyErrorId((curr) => (curr === prompt.id ? null : curr));
      }, 3500);
    }
  };

  return (
    <section
      id="sample-prompts"
      aria-labelledby="sample-prompts-heading"
      className="scroll-mt-24 space-y-6 pt-8 border-t border-[#18264F]/10"
    >
      <div className="space-y-2">
        <h2
          id="sample-prompts-heading"
          className="font-display text-2xl sm:text-3xl font-semibold text-[#18264F]"
        >
          Try these sample prompts
        </h2>
        <p className="text-sm sm:text-base text-[#18264F]/70">
          Copy a prompt, give it to your AI agent and see what you can create.
        </p>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt, index) => {
          const isOpen = expandedId === prompt.id;
          const isCopied = copiedId === prompt.id;
          const hasCopyError = copyErrorId === prompt.id;
          const numberLabel = String(index + 1).padStart(2, '0');
          const panelId = `prompt-panel-${prompt.id}`;
          const buttonId = `prompt-trigger-${prompt.id}`;

          return (
            <div
              key={prompt.id}
              data-testid={`prompt-card-${prompt.id}`}
              className="scroll-mt-24 bg-white rounded-2xl border border-[#18264F]/10 shadow-xs transition-shadow duration-200 hover:shadow-sm overflow-hidden"
            >
              {/* Collapsed Trigger: ONLY prompt heading and expand/collapse icon */}
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => handleToggle(prompt.id)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 text-left hover:bg-[#F5F5FA]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#304A96]/40"
                >
                  <span className="font-display text-base sm:text-lg font-semibold text-[#18264F]">
                    <span className="font-mono text-sm text-[#304A96] mr-2 tabular-nums">
                      {numberLabel}.{' '}
                    </span>
                    {prompt.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="w-7 h-7 rounded-lg bg-[#F5F5FA] text-[#304A96] flex items-center justify-center shrink-0 transition-transform duration-200"
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
              </h3>

              {/* Smooth Height + Opacity Accordion Body */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-[#18264F]/8 space-y-4">
                      {/* Expanded Header: Short description, Difficulty badge, and Top-Right Copy Prompt button */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#EAEAF6] text-[#304A96] text-xs font-semibold">
                              {prompt.difficulty}
                            </span>
                            {prompt.featured && (
                              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#F2A77F]/25 text-[#18264F] text-xs font-semibold">
                                Featured
                              </span>
                            )}
                          </div>
                          {prompt.description && (
                            <p className="text-sm text-[#18264F]/75 leading-relaxed">
                              {prompt.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleCopyPrompt(prompt)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              isCopied
                                ? 'bg-emerald-700 text-white'
                                : 'bg-[#304A96] text-white hover:bg-[#18264F]'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Prompt</span>
                              </>
                            )}
                          </button>
                          {hasCopyError && (
                            <span role="alert" className="text-[11px] text-red-700 font-medium">
                              Clipboard blocked — select text below to copy.
                            </span>
                          )}
                        </div>
                      </div>

                      {prompt.previewImage && isSafeUrl(prompt.previewImage) && (
                        <div className="aspect-video max-w-md rounded-2xl overflow-hidden border border-[#18264F]/10 bg-[#F5F5FA]">
                          <img
                            src={prompt.previewImage}
                            alt={`${prompt.title} preview`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Complete Prompt Text Container */}
                      <div className="bg-[#F5F5FA] rounded-2xl border border-[#18264F]/8 p-4 sm:p-5">
                        <pre className="whitespace-pre-wrap break-words font-sans text-sm text-[#18264F] leading-[1.65] m-0">
                          {prompt.content}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
