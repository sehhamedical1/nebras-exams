/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateGame } from './pages/CreateGame';
import { Reports } from './pages/Reports';
import { StudentLogin } from './pages/StudentLogin';
import { StudentPlay } from './pages/StudentPlay';
import { StudentResult } from './pages/StudentResult';
import { TeacherPreview } from './pages/TeacherPreview';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateGame />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        
        {/* Full screen routes without sidebar */}
        <Route path="/preview" element={<TeacherPreview />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/exam/:code" element={<StudentLogin />} />
        <Route path="/student/play" element={<StudentPlay />} />
        <Route path="/student/result" element={<StudentResult />} />
      </Routes>
    </BrowserRouter>
  );
}
