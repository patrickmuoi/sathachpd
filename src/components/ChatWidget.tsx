// MIT License - Chat Widget Component with Gemini AI Integration
// Copyright (c) 2026 Police Exam Portal UX Team

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  X,
  Send,
  UserCheck,
  Shield,
  HelpCircle,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { sendDutyOfficerChat, type ChatTurn } from '../lib/gemini';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent' | 'system';
  text: string;
  card?: {
    title: string;
    content: string;
  };
  timestamp: string;
}

export default function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isGeminiMode, setIsGeminiMode] = useState(false);
  const [geminiTurns, setGeminiTurns] = useState<ChatTurn[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto focus input when opened in live mode
      if (isGeminiMode) {
        inputRef.current?.focus();
      }
    }
  }, [messages, isTyping, isOpen, isGeminiMode]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const quickQuestions = [
    { key: 'q1', text: t('chat.q1', 'Làm sao để bắt đầu làm bài thi?'), answer: t('chat.a1', 'Sĩ quan vào mục "Bài thi của tôi" ở menu bên trái. Tại bài thi có trạng thái "Được giao", bấm nút "Bắt đầu làm bài" và xác nhận tuân thủ quy chế thi.') },
    { key: 'q2', text: t('chat.q2', 'Quy định chống gian lận kiểm soát như thế nào?'), answer: t('chat.a2', 'Hệ thống tự động phát hiện chuyển tab hoặc rời ứng dụng. Rời quá 3 lần (trên máy tính) hoặc quá 30 giây (trên điện thoại) bài thi sẽ bị tự động nộp ngay lập tức. Thao tác copy, paste và chuột phải cũng bị khóa.') },
    { key: 'q3', text: t('chat.q3', 'Bao lâu thì nhận được kết quả điểm thi?'), answer: t('chat.a3', 'Nếu bài thi chỉ gồm câu hỏi trắc nghiệm, điểm số sẽ có ngay lập tức khi nộp bài. Đối với bài thi có câu tự luận hoặc giải thích, kết quả sẽ có sau khi cấp trên (Grader) hoàn thành việc chấm điểm.') },
    { key: 'q4', text: t('chat.q4', 'Cách thức đăng ký thi lấy chứng chỉ ngành?'), answer: t('chat.a4', 'Truy cập mục "Chứng chỉ ngành", chọn chứng chỉ mong muốn và bấm "Đăng ký". Sau khi Quản trị viên duyệt hồ sơ điều kiện, bài kiểm tra sẽ tự động được giao vào danh sách thi.') },
  ];

  const suggestedDutyQuestions = [
    'Quy chế chống gian lận kiểm soát như thế nào?',
    'Làm thế nào để đăng ký thi chứng chỉ nghiệp vụ?',
    'Điều kiện để sĩ quan được thăng cấp bậc?',
    'Quy trình nộp đơn phúc khảo bài thi?',
  ];

  const handleSelectQuestion = (q: { text: string; answer: string }) => {
    if (isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: q.answer,
        card: {
          title: 'Tài liệu hướng dẫn liên quan',
          content: 'Xem thêm trong Quy định thi nghiệp vụ & Sổ tay chiến sĩ 2026.',
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 700);
  };

  // Kích hoạt kết nối với Cán bộ trực ban tư vấn (Gemini AI)
  const handleConnectDutyOfficer = () => {
    if (isTyping) return;

    setIsGeminiMode(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: 'Trò chuyện với cán bộ trực ban tư vấn',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const sysMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'system',
      text: 'Đã thiết lập đường truyền trực tuyến với Cán bộ Trực ban Tư vấn Sát hạch & Nghiệp vụ.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const officerGreetingText =
      'UPD xin chào! Tôi là Sĩ quan Trực ban Tư vấn Sát hạch & Nghiệp vụ trực thuộc Sở Cảnh sát.\n\n' +
      'Tôi trực ban 24/7 để hướng dẫn nội dung học tập, giải đáp các dạng câu hỏi, thủ tục sát hạch thăng cấp, đăng ký chứng chỉ và quy định chống gian lận. Sĩ quan cần tôi hỗ trợ nội dung gì hôm nay?';

    const agentGreeting: ChatMessage = {
      id: (Date.now() + 2).toString(),
      sender: 'agent',
      text: officerGreetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, sysMsg, agentGreeting]);
    setGeminiTurns([
      { role: 'user', text: 'Xin chào sĩ quan trực ban tư vấn.' },
      { role: 'model', text: officerGreetingText },
    ]);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  // Làm mới hội thoại
  const handleResetChat = () => {
    setMessages([]);
    setGeminiTurns([]);
    setIsGeminiMode(false);
    setIsTyping(false);
    setInputValue('');
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();

    const textToSend = customText !== undefined ? customText.trim() : inputValue.trim();
    if (!textToSend || isTyping) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsTyping(true);

    if (isGeminiMode) {
      // Gọi trực tiếp Gemini API
      try {
        const nextTurns: ChatTurn[] = [...geminiTurns, { role: 'user', text: textToSend }];
        setGeminiTurns(nextTurns);

        const replyText = await sendDutyOfficerChat(nextTurns);

        const agentMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, agentMsg]);
        setGeminiTurns([...nextTurns, { role: 'model', text: replyText }]);
      } catch (err: any) {
        console.error('Gemini Chat Error:', err);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: 'Lỗi đường truyền: Không thể nhận phản hồi từ Gemini API. Vui lòng thử lại sau giây lát.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Khi ở chế độ thông thường, tự động kích hoạt Cán bộ trực ban Gemini nếu người dùng nhập câu hỏi tự do
      setTimeout(async () => {
        setIsGeminiMode(true);
        const sysMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: 'Đã chuyển tiếp câu hỏi đến Cán bộ Trực ban Tư vấn Sát hạch...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, sysMsg]);

        try {
          const initialTurns: ChatTurn[] = [{ role: 'user', text: textToSend }];
          const replyText = await sendDutyOfficerChat(initialTurns);

          const agentMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            sender: 'agent',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setMessages((prev) => [...prev, agentMsg]);
          setGeminiTurns([...initialTurns, { role: 'model', text: replyText }]);
        } catch {
          const fallbackMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            sender: 'bot',
            text: 'Hệ thống đã nhận thông tin. Vui lòng bấm "Trò chuyện với Cán bộ trực ban" bên trên để được tư vấn tương tác trực tiếp.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, fallbackMsg]);
        } finally {
          setIsTyping(false);
        }
      }, 500);
    }
  };

  // Helper format text (bolding, lists, linebreaks)
  const renderMessageContent = (rawText: string) => {
    const lines = rawText.split('\n');
    return (
      <div className="space-y-1 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Bullet list item
          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
          const formattedLine = isBullet ? line.trim().substring(2) : line;

          // Parse **bold** parts
          const parts = formattedLine.split(/(\*\*.*?\*\*)/g);

          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-[#ffd700] dark:text-[#ffd700] text-amber-900 dark:text-amber-300">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2 text-xs">
                <span className="text-[#ffd700] shrink-0 mt-0.5">•</span>
                <span>{renderedLine}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs">
              {renderedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="u215 fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="u215-bubble flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#102240] to-[#1a3a6b] text-[#ffd700] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#ffd700]/30 border-2 border-[#ffd700]/40"
          aria-label={t('chat.buttonLabel', 'Mở trợ giúp tư vấn')}
          aria-expanded={false}
        >
          <MessageSquare className="h-6 w-6 text-[#ffd700]" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white dark:border-slate-900"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          role="dialog"
          aria-label={t('chat.title', 'Cán bộ trực ban tư vấn')}
          aria-modal="true"
          className="u215-window flex flex-col w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#102240] via-[#152e55] to-[#1a3a6b] text-white p-3.5 flex items-center justify-between border-b border-[#ffd700]/20 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b172b] border border-[#ffd700]/50 shadow-inner">
                {isGeminiMode ? (
                  <Sparkles className="h-5 w-5 text-[#ffd700] animate-pulse" />
                ) : (
                  <Shield className="h-5 w-5 text-[#ffd700]" />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#102240] animate-pulse" />
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight flex items-center gap-1.5">
                  {isGeminiMode ? 'Cán bộ Trực ban Tư vấn' : 'Cổng Tư Vấn Sát Hạch'}
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#ffd700] text-[#060d17] tracking-wider uppercase">
                    {isGeminiMode ? 'Gemini AI' : 'Hỗ trợ'}
                  </span>
                </h3>
                <p className="text-[11px] text-amber-200/90 mt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {isGeminiMode ? 'Trực tuyến 24/7 • Sẵn sàng giải đáp' : 'Hỗ trợ nghiệp vụ & quy chế thi'}
                </p>
              </div>
            </div>

            {/* Actions: Reset & Close */}
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  title="Làm mới hội thoại"
                  className="rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                aria-label={t('common.close', 'Đóng')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg)]">
            {/* Initial Welcome & Duty Officer Banner */}
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1a3a6b] text-[#ffd700] text-xs font-bold border border-[#ffd700]/30 shadow-sm">
                PD
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text)] shadow-sm border border-[var(--color-border)]">
                <p className="font-bold text-[#1a3a6b] dark:text-[#ffd700] mb-1 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                  Cổng Trực Ban Tư Vấn Sở Cảnh Sát
                </p>
                Chào Sĩ quan! Sĩ quan có thể tra cứu nhanh các câu hỏi thường gặp bên dưới, hoặc bấm vào nút kết nối trực tiếp với <strong>Cán bộ trực ban tư vấn</strong> để được hỗ trợ chuyên sâu mọi lúc mọi nơi.
              </div>
            </div>

            {/* PROMINENT GEMINI DUTY OFFICER CALLOUT CARD */}
            {!isGeminiMode && (
              <div className="rounded-2xl bg-gradient-to-br from-[#102240] to-[#1a3a6b] p-3.5 text-white shadow-md border border-[#ffd700]/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#ffd700]/20 flex items-center justify-center border border-[#ffd700]/40">
                    <Sparkles className="h-4 w-4 text-[#ffd700]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#ffd700]">Trò chuyện với Cán bộ Trực ban Tư vấn</h4>
                    <p className="text-[10px] text-slate-300">Tích hợp mô hình AI chuyên trách quy chế & nghiệp vụ</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-200 leading-snug">
                  Sĩ quan cần giải đáp về quy chế chống gian lận, thi thăng cấp, đăng ký chứng chỉ hay cách nộp phúc khảo?
                </p>

                <button
                  onClick={handleConnectDutyOfficer}
                  disabled={isTyping}
                  className="w-full py-2 px-3 rounded-xl bg-[#ffd700] hover:bg-amber-400 text-[#060d17] font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Bắt đầu trò chuyện với Trực ban</span>
                </button>
              </div>
            )}

            {/* Quick Questions Accordion/Chips (FAQ mode) */}
            {!isGeminiMode && (
              <div className="space-y-1.5 pt-1 pb-1">
                <p className="text-[11px] font-bold text-[var(--color-text-secondary)] px-1 uppercase tracking-wider">
                  Câu hỏi thường gặp:
                </p>
                <div className="flex flex-col gap-1.5">
                  {quickQuestions.map((q) => (
                    <button
                      key={q.key}
                      onClick={() => handleSelectQuestion(q)}
                      disabled={isTyping}
                      className="flex items-center justify-between text-left text-xs px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[#ffd700] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] shadow-sm transition-all group disabled:opacity-50"
                    >
                      <span className="line-clamp-1 font-medium">{q.text}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-secondary)] group-hover:text-[#ffd700] shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick suggestions in Gemini live mode */}
            {isGeminiMode && messages.length <= 3 && (
              <div className="space-y-1.5 pt-1 pb-2">
                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] px-1 uppercase">
                  Gợi ý câu hỏi trực ban:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedDutyQuestions.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, promptText)}
                      disabled={isTyping}
                      className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[#ffd700] text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Conversation Messages */}
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.sender === 'system' ? (
                  <div className="flex justify-center my-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-center font-medium">
                      <HelpCircle className="h-3 w-3 shrink-0" />
                      <span>{msg.text}</span>
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {msg.sender !== 'user' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#1a3a6b] text-[#ffd700] text-[10px] font-bold border border-[#ffd700]/30 shadow-sm mt-0.5">
                        {msg.sender === 'agent' ? 'TB' : 'PD'}
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${msg.sender === 'user'
                        ? 'bg-[#1a3a6b] text-white rounded-tr-sm'
                        : 'bg-[var(--color-surface)] text-[var(--color-text)] rounded-tl-sm border border-[var(--color-border)]'
                        }`}
                    >
                      {/* Message Content */}
                      {renderMessageContent(msg.text)}

                      {/* Attached info card if any */}
                      {msg.card && (
                        <div className="mt-2.5 p-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[11px]">
                          <p className="font-bold text-amber-600 dark:text-amber-400">
                            {msg.card.title}
                          </p>
                          <p className="text-[var(--color-text-secondary)] mt-0.5">
                            {msg.card.content}
                          </p>
                        </div>
                      )}

                      <span
                        className={`block text-[9px] mt-1.5 text-right ${msg.sender === 'user'
                          ? 'text-slate-300'
                          : 'text-[var(--color-text-secondary)]'
                          }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1a3a6b] text-[#ffd700] text-[10px] font-bold border border-[#ffd700]/30">
                  TB
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm border border-[var(--color-border)]">
                  <span className="text-[11px] text-[var(--color-text-secondary)] italic">
                    Cán bộ trực ban đang soạn trả lời...
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isGeminiMode
                  ? 'Hỏi Cán bộ trực ban tư vấn...'
                  : 'Nhập câu hỏi hoặc yêu cầu hỗ trợ...'
              }
              disabled={isTyping}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3a6b] text-[#ffd700] hover:bg-[#152e55] disabled:opacity-40 transition-all shrink-0 active:scale-95 shadow-sm"
              aria-label={t('chat.send', 'Gửi')}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
