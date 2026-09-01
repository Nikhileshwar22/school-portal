import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboardNew";
import TeacherDashboard from "./pages/TeacherDashboardNew";
import AdminDashboard from "./pages/AdminDashboardNew";
import GoogleSuccess from "./pages/GoogleSuccess";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {

    return (
        <BrowserRouter>

            <AuthProvider>
            <ToastProvider>

                <Routes>

                    <Route
                        path="/login"
                        element={<Login />}
                    />
                    <Route
    path="/google-success"
    element={<GoogleSuccess />}
/>

                    <Route
                        path="/student"
                        element={
                            <ProtectedRoute
                                allowedRoles={["STUDENT"]}
                            >
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/teacher"
                        element={
                            <ProtectedRoute
                                allowedRoles={["TEACHER"]}
                            >
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute
                                allowedRoles={["ADMIN"]}
                            >
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <Navigate to="/login" />
                        }
                    />

                </Routes>

            </ToastProvider>
            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;