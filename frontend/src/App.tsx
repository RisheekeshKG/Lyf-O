import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { AppShell } from "./layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { AssistantPage } from "./pages/AssistantPage";
import { InboxPage } from "./pages/InboxPage";
import { RecommendPage } from "./pages/RecommendPage";
import { WorkTasksPage } from "./pages/WorkTasksPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { WeeklyNotesPage } from "./pages/WeeklyNotesPage";
import { SharedResourcesPage } from "./pages/SharedResourcesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DocumentPage } from "./pages/DocumentPage";

export default function App() {
  return (
    <HashRouter>
      <WorkspaceProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="recommend" element={<RecommendPage />} />
            <Route path="tasks" element={<WorkTasksPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="notes" element={<WeeklyNotesPage />} />
            <Route path="resources" element={<SharedResourcesPage />} />
            <Route path="resources/engineering" element={<SharedResourcesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="pages/:file" element={<DocumentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </WorkspaceProvider>
    </HashRouter>
  );
}
