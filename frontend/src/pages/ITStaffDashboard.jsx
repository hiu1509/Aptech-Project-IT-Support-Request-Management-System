import { useNavigate } from "react-router-dom";

import ITStaffSidebar
    from "../components/ITStaffSidebar";

import "../css/ITStaffDashboard.css";


function ITStaffDashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    return (
        <div className="itstaff-dashboard-layout">

            <ITStaffSidebar />


            <main className="itstaff-dashboard-main">

                <header className="itstaff-dashboard-header">

                    <div>

                        <h1>
                            IT Staff Dashboard
                        </h1>

                        <p>
                            Welcome back,{" "}
                            <strong>
                                {user?.fullName ||
                                    "IT Staff"}
                            </strong>
                            .
                        </p>

                    </div>

                </header>


                <div className="itstaff-dashboard-content">

                    <section className="itstaff-dashboard-welcome-card">

                        <div className="itstaff-dashboard-welcome-icon">

                            <svg viewBox="0 0 24 24">
                                <path d="M4 5H20" />
                                <path d="M4 12H20" />
                                <path d="M4 19H20" />
                                <circle cx="7" cy="5" r="1" />
                                <circle cx="7" cy="12" r="1" />
                                <circle cx="7" cy="19" r="1" />
                            </svg>

                        </div>


                        <div>

                            <h2>
                                Assigned Support Requests
                            </h2>

                            <p>
                                View requests assigned to you,
                                accept handling, update progress,
                                and submit completed work for
                                internal review.
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/it-staff/requests"
                                )
                            }
                        >
                            View Assigned Requests
                        </button>

                    </section>


                    <section className="itstaff-dashboard-info-grid">

                        <div className="itstaff-dashboard-info-card">

                            <div className="itstaff-dashboard-info-label">
                                Your Role
                            </div>

                            <div className="itstaff-dashboard-info-value">
                                IT Staff
                            </div>

                            <p>
                                Handle technical support requests
                                assigned by the IT Team Lead.
                            </p>

                        </div>


                        <div className="itstaff-dashboard-info-card">

                            <div className="itstaff-dashboard-info-label">
                                Workflow
                            </div>

                            <div className="itstaff-dashboard-info-value">
                                Assigned → In Progress
                            </div>

                            <p>
                                Accept assigned requests before
                                starting technical handling.
                            </p>

                        </div>


                        <div className="itstaff-dashboard-info-card">

                            <div className="itstaff-dashboard-info-label">
                                Completion
                            </div>

                            <div className="itstaff-dashboard-info-value">
                                Internal Review
                            </div>

                            <p>
                                Submit completed handling to the
                                Coordinator for internal review.
                            </p>

                        </div>

                    </section>

                </div>

            </main>

        </div>
    );
}


export default ITStaffDashboard;