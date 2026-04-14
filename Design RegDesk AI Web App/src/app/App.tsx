import { useState, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Menu,
  Plus,
  Send,
  Moon,
  Sun,
  MessageSquare,
  CheckCircle2,
  Circle,
  Clock,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
  ListTodo,
  GripVertical,
  LogOut
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastMessageTime: Date;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  chatId: string;
}

interface Reminder {
  id: string;
  message: string;
  type: 'info' | 'warning';
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChat = chats.find(chat => chat.id === currentChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Extract tasks from AI response
  const extractTasksFromResponse = (content: string): string[] => {
    const tasks: string[] = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      // Look for numbered lists
      const numberedMatch = line.match(/^\d+\.\s+\*\*(.*?)\*\*/);
      if (numberedMatch) {
        tasks.push(numberedMatch[1]);
      }

      // Look for bullet points with bold text
      const bulletMatch = line.match(/^[-*]\s+\*\*(.*?)\*\*/);
      if (bulletMatch) {
        tasks.push(bulletMatch[1]);
      }
    });

    return tasks;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    let activeChatId = currentChatId;

    // Create a new chat if none exists
    if (!currentChat) {
      const newChatId = `chat-${Date.now()}`;
      const newChat: Chat = {
        id: newChatId,
        title: inputValue.slice(0, 50),
        messages: [],
        lastMessageTime: new Date()
      };
      setChats([newChat]);
      setCurrentChatId(newChatId);
      activeChatId = newChatId;
    }

    const newUserMessage: Message = {
      id: `m${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setChats(prevChats => {
      return prevChats.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, newUserMessage],
              lastMessageTime: new Date(),
              title: chat.messages.length === 0 ? inputValue.slice(0, 50) : chat.title
            }
          : chat
      );
    });

    setInputValue('');
    setIsTyping(true);

    // Simulate AI response with task extraction
    setTimeout(() => {
      const responses = [
        {
          content: "Great question! Let me break this down for you in simple steps.\n\nHere's what you need to know about tax filing for small businesses in Nigeria:\n\n1. **Register for Tax Identification Number (TIN)** - Get this from FIRS\n2. **File annual tax returns** - Due every January\n3. **Keep proper business records** - Track all income and expenses\n4. **Pay your taxes on time** - Avoid penalties\n\nAs a small business, you'll typically pay:\n- Company Income Tax (30% of profits)\n- Value Added Tax (VAT) if turnover exceeds ₦25 million\n\nWould you like me to explain any of these in more detail?",
          tasks: ['Register for Tax Identification Number (TIN)', 'File annual tax returns', 'Keep proper business records', 'Pay your taxes on time']
        },
        {
          content: "I understand this can feel overwhelming, but let's take it one step at a time.\n\nFor CAC business registration, here's the simple process:\n\n1. **Search for name availability** - Visit CAC portal at cac.gov.ng\n2. **Reserve your business name** - Costs about ₦500\n3. **Complete registration forms** - Fill CAC forms online\n4. **Pay registration fee** - Around ₦10,000 for business name\n5. **Submit required documents** - ID, passport photo, address proof\n\nThe whole process takes 2-3 weeks if everything is in order. The CAC portal is user-friendly and guides you through each step.",
          tasks: ['Search for name availability on CAC portal', 'Reserve your business name', 'Complete CAC registration forms', 'Pay registration fee', 'Submit required documents']
        }
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const aiResponse: Message = {
        id: `m${Date.now()}`,
        role: 'assistant',
        content: randomResponse.content,
        timestamp: new Date()
      };

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, aiResponse],
                lastMessageTime: new Date()
              }
            : chat
        )
      );

      // Auto-generate tasks from the response
      const newTasks = randomResponse.tasks.map((taskTitle, index) => ({
        id: `t${Date.now()}-${index}`,
        title: taskTitle,
        status: 'pending' as const,
        chatId: currentChatId
      }));

      setTasks(prevTasks => [...prevTasks, ...newTasks]);
      setIsTyping(false);

      // Show right panel if collapsed to highlight new tasks
      if (rightPanelCollapsed && newTasks.length > 0) {
        setTimeout(() => {
          setRightPanelCollapsed(false);
        }, 500);
      }
    }, 1500);
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      lastMessageTime: new Date()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setShowLeftSidebar(false);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id !== taskId) return task;

        const statusOrder: Task['status'][] = ['pending', 'in-progress', 'completed'];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

        return { ...task, status: nextStatus };
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0d9488]/10 rounded-2xl mb-2">
              <MessageSquare className="w-8 h-8 text-[#0d9488]" />
            </div>
            <h1 className="text-3xl">Welcome to RegDesk</h1>
            <p className="text-muted-foreground">
              Your AI assistant for Nigerian business registration and compliance
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <button
              onClick={() => setIsLoggedIn(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-border hover:bg-accent rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-foreground">Continue with Google</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50 transition-shadow"
              />
              <button
                onClick={() => setIsLoggedIn(true)}
                className="w-full px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Continue with Email
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-foreground/80">
                <strong>Note:</strong> To enable persistent login and data storage, connect Supabase from the Make settings page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header - Mobile Only */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/50">
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="tracking-tight">RegDesk</h1>
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          className="p-2 hover:bg-accent rounded-lg transition-colors relative"
        >
          <ListTodo className="w-5 h-5" />
          {tasks.filter(t => t.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0d9488] text-white text-xs rounded-full flex items-center justify-center">
              {tasks.filter(t => t.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - Chat History */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className={`
              ${showLeftSidebar ? 'fixed' : 'hidden lg:block'}
              ${showLeftSidebar ? 'inset-y-0 left-0 z-40 w-72' : ''}
            `}
          >
            <aside className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
              <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="tracking-tight">RegDesk</h1>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsDark(!isDark)}
                      className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <h3 className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Chat History
                </h3>
                <div className="space-y-1">
                  {chats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setShowLeftSidebar(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg transition-colors
                        ${currentChatId === chat.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span className="truncate text-sm">{chat.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-sidebar-border space-y-1">
                <button className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-sidebar-accent rounded-lg transition-colors text-sidebar-foreground">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </button>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-sidebar-accent rounded-lg transition-colors text-sidebar-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </aside>
          </Panel>

          {/* Overlay for mobile left sidebar */}
          {showLeftSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setShowLeftSidebar(false)}
            />
          )}

          {/* Main Chat Area */}
          <Panel defaultSize={55} minSize={30}>
            <main className="h-full flex flex-col overflow-hidden bg-background">
              {!currentChat || currentChat.messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="max-w-2xl text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0d9488]/10 rounded-2xl mb-2">
                      <MessageSquare className="w-8 h-8 text-[#0d9488]" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl">Start a conversation</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Ask me anything about Nigerian business registration, compliance, and legal requirements.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="max-w-3xl mx-auto space-y-6">
                    {currentChat?.messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="shrink-0 w-8 h-8 rounded-full bg-[#0d9488]/10 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-[#0d9488]" />
                          </div>
                        )}
                        <div
                          className={`
                            max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl
                            ${message.role === 'user'
                              ? 'bg-[#0d9488] text-white rounded-br-md'
                              : 'bg-accent/50 text-foreground rounded-bl-md'
                            }
                          `}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="shrink-0 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-foreground/60" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#0d9488]/10 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-[#0d9488]" />
                        </div>
                        <div className="px-4 py-3 bg-accent/50 rounded-2xl rounded-bl-md">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-border/50 p-4 bg-background">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ask RegDesk…"
                        rows={1}
                        className="w-full px-4 py-3 bg-input-background border border-border/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50 transition-shadow"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      className="shrink-0 p-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </Panel>

          {/* Resize Handle */}
          {!rightPanelCollapsed && (
            <PanelResizeHandle className="hidden lg:block w-1 hover:w-1.5 bg-border/50 hover:bg-[#0d9488] transition-all cursor-col-resize group relative">
              <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            </PanelResizeHandle>
          )}

          {/* Right Panel - My Desk */}
          {!rightPanelCollapsed && (
            <Panel defaultSize={25} minSize={20} maxSize={35}>
              <aside
                className={`
                  ${showRightPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                  h-full bg-card border-l border-border/50
                  flex flex-col transition-transform duration-300 ease-in-out
                  overflow-y-auto
                  ${showRightPanel ? 'fixed lg:relative inset-y-0 right-0 z-40 w-80 lg:w-full' : 'hidden lg:flex'}
                `}
              >
                <div className="sticky top-0 bg-card border-b border-border/50 p-4 z-10">
                  <div className="flex items-center justify-between">
                    <h2>My Desk</h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRightPanelCollapsed(true)}
                        className="hidden lg:block p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Collapse panel"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowRightPanel(false)}
                        className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-6">
                  {/* Progress Tracker */}
                  <div className="p-4 bg-gradient-to-br from-[#0d9488]/10 to-[#0d9488]/5 rounded-xl border border-[#0d9488]/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm">Business Setup</h3>
                      <span className="text-sm font-mono text-[#0d9488]">
                        {progressPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0d9488] transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {progressPercentage < 30 && 'Just getting started'}
                      {progressPercentage >= 30 && progressPercentage < 70 && 'Making good progress'}
                      {progressPercentage >= 70 && progressPercentage < 100 && 'Almost there'}
                      {progressPercentage === 100 && 'Ready to launch!'}
                    </p>
                  </div>

                  {/* Tasks */}
                  <div>
                    <h3 className="text-sm mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                      Tasks ({tasks.length})
                    </h3>
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div
                          key={task.id}
                          className="p-3 bg-accent/30 hover:bg-accent/50 rounded-lg transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTaskStatus(task.id)}
                              className="shrink-0 mt-0.5"
                            >
                              {task.status === 'completed' && (
                                <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                              )}
                              {task.status === 'in-progress' && (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                              {task.status === 'pending' && (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${
                                task.status === 'completed'
                                  ? 'line-through text-muted-foreground'
                                  : 'text-foreground'
                              }`}>
                                {task.title}
                              </p>
                              {task.status === 'in-progress' && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  In progress
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reminders */}
                  <div>
                    <h3 className="text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Reminders
                    </h3>
                    <div className="space-y-2">
                      {reminders.map(reminder => (
                        <div
                          key={reminder.id}
                          className={`
                            p-3 rounded-lg border
                            ${reminder.type === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-accent/30 border-border/50'
                            }
                          `}
                        >
                          <p className="text-sm text-foreground/90">
                            {reminder.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            </Panel>
          )}

          {/* Overlay for right panel mobile */}
          {showRightPanel && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setShowRightPanel(false)}
            />
          )}
        </PanelGroup>

        {/* Collapsed Right Panel Icon (Desktop) */}
        {rightPanelCollapsed && (
          <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-20">
            <button
              onClick={() => setRightPanelCollapsed(false)}
              className="bg-[#0d9488] hover:bg-[#0f766e] text-white p-3 rounded-l-xl shadow-lg transition-all relative group"
              title="Open My Desk"
            >
              <ChevronLeft className="w-5 h-5" />
              {tasks.filter(t => t.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {tasks.filter(t => t.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}