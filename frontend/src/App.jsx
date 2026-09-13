import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import AdminRequestDetail from "./pages/AdminRequestDetail";
import Users from "./pages/Users";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import Permissions from "./pages/Permissions";
import UserPermissions from "./pages/UserPermissions";
import Settings from "./pages/Settings";
import ITGroups from "./pages/ITGroups";
import Workflow from "./pages/Workflow";
import Reports from "./pages/Reports";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeNewRequest from "./pages/EmployeeNewRequest";
import EmployeeMyRequests from "./pages/EmployeeMyRequests";
import EmployeeRequestDetail from "./pages/EmployeeRequestDetail";
import EmployeeProfile from "./pages/EmployeeProfile";

import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import CoordinatorRequests from "./pages/CoordinatorRequests";
import CoordinatorRequestDetail from "./pages/CoordinatorRequestDetail";

import LeaderDashboard from "./pages/LeaderDashboard";
import LeaderRequests from "./pages/LeaderRequests";
import LeaderRequestDetail from "./pages/LeaderRequestDetail";
import LeaderTeam from "./pages/LeaderTeam";

import ITStaffDashboard from "./pages/ITStaffDashboard";
import ITStaffRequests from "./pages/ITStaffRequests";
import ITStaffRequestDetail from "./pages/ITStaffRequestDetail";

function App() {
    const token =
        localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const normalizeRoleCode = (role) => {
        const value =
            typeof role === "string"
                ? role
                : role?.code;

        return (value || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
    };

    const roleCodes =
        Array.isArray(user?.roles)
            ? user.roles
                .map(normalizeRoleCode)
                .filter(Boolean)
            : [];


    const isAdmin =
        roleCodes.includes("ADMIN");

    const isEmployee =
        roleCodes.includes("EMPLOYEE") ||
        roleCodes.includes("USER");

    const isCoordinator =
        roleCodes.includes("COORDINATOR");

    const isLeader =
        roleCodes.includes("LEADER");

    const isITStaff =
        roleCodes.includes("ITSTAFF") ||
        roleCodes.includes("IT_STAFF");

    const getHomeRoute = () => {
        if (isAdmin) {
            return "/dashboard";
        }

        if (isCoordinator) {
            return "/coordinator/dashboard";
        }

        if (isEmployee) {
            return "/employee/dashboard";
        }

        if (isLeader) {
            return "/leader/dashboard";
        }

        if (isITStaff) {
            return "/it-staff/dashboard";
        }

        return "/login";
    };


    return (
        <Routes>

            {/* ======================================
                ROOT
               ====================================== */}

            <Route
                path="/"
                element={
                    token
                        ? (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                        : (
                            <Navigate
                                to="/login"
                                replace
                            />
                        )
                }
            />


            {/* ======================================
                LOGIN
               ====================================== */}

            <Route
                path="/login"
                element={
                    token
                        ? (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                        : (
                            <Login />
                        )
                }
            />

            <Route
                path="/forgot-password"
                element={<ForgotPassword />}
            />

            <Route
                path="/reset-password"
                element={<ResetPassword />}
            />


            {/* ======================================
                ADMIN ROUTES
               ====================================== */}

            <Route
                path="/dashboard"
                element={
                    token && isAdmin
                        ? <Dashboard />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/requests"
                element={
                    token && isAdmin
                        ? <Requests />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/requests/:id"
                element={
                    token && isAdmin
                        ? <AdminRequestDetail />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/workflow"
                element={
                    token && isAdmin
                        ? <Workflow />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/reports"
                element={
                    token && isAdmin
                        ? <Reports />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/users"
                element={
                    token && isAdmin
                        ? <Users />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/users/new"
                element={
                    token && isAdmin
                        ? <AddUser />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/users/:id/edit"
                element={
                    token && isAdmin
                        ? <EditUser />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/settings"
                element={
                    token && isAdmin
                        ? <Settings />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/permissions"
                element={
                    token && isAdmin
                        ? <Permissions />
                        : <Navigate
                            to={getHomeRoute()}
                            replace
                        />
                }
            />

            <Route
                path="/users/:id/permissions"
                element={
                    token && isAdmin
                        ? <UserPermissions />
                        : <Navigate
                            to={getHomeRoute()}
                            replace
                        />
                }
            />

            <Route
                path="/it-groups"
                element={
                    token && isAdmin
                        ? <ITGroups />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            {/* ======================================
                EMPLOYEE ROUTES
               ====================================== */}

            <Route
                path="/employee/dashboard"
                element={
                    token && isEmployee
                        ? <EmployeeDashboard />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/employee/requests/new"
                element={
                    token && isEmployee
                        ? <EmployeeNewRequest />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/employee/requests"
                element={
                    token && isEmployee
                        ? <EmployeeMyRequests />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/employee/requests/:id"
                element={
                    token && isEmployee
                        ? <EmployeeRequestDetail />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/employee/profile"
                element={
                    token && isEmployee
                        ? <EmployeeProfile />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            {/* ======================================
                COORDINATOR ROUTES
               ====================================== */}

            <Route
                path="/coordinator/dashboard"
                element={
                    token && isCoordinator
                        ? <CoordinatorDashboard />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/coordinator/requests"
                element={
                    token && isCoordinator
                        ? <CoordinatorRequests />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />


            <Route
                path="/coordinator/requests/:id"
                element={
                    token && isCoordinator
                        ? <CoordinatorRequestDetail />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            {/* ======================================
                IT TEAM LEADER ROUTES
               ====================================== */}

            <Route
                path="/leader/dashboard"
                element={
                    token && isLeader
                        ? <LeaderDashboard />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/leader/requests"
                element={
                    token && isLeader
                        ? <LeaderRequests />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/leader/requests/:id"
                element={
                    token && isLeader
                        ? <LeaderRequestDetail />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/leader/team"
                element={
                    token && isLeader
                        ? <LeaderTeam />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            {/* ======================================
                IT STAFF ROUTES
               ====================================== */}

            <Route
                path="/it-staff/dashboard"
                element={
                    token && isITStaff
                        ? <ITStaffDashboard />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/it-staff/requests"
                element={
                    token && isITStaff
                        ? <ITStaffRequests />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            <Route
                path="/it-staff/requests/:id"
                element={
                    token && isITStaff
                        ? <ITStaffRequestDetail />
                        : (
                            <Navigate
                                to={getHomeRoute()}
                                replace
                            />
                        )
                }
            />

            {/* ======================================
                FALLBACK
               ====================================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to={
                            token
                                ? getHomeRoute()
                                : "/login"
                        }
                        replace
                    />
                }
            />

        </Routes>
    );
}

export default App;