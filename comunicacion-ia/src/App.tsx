import { useStore } from "./store/useStore";
import { SelectorView } from "./views/SelectorView";
import { BriefingView } from "./views/BriefingView";
import { ChatView } from "./views/ChatView";
import { FeedbackView } from "./views/FeedbackView";

export default function App() {
  const view = useStore((s) => s.view);

  switch (view) {
    case "selector": return <SelectorView />;
    case "briefing": return <BriefingView />;
    case "chat": return <ChatView />;
    case "feedback": return <FeedbackView />;
  }
}