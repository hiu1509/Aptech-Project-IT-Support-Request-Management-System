import { useNavigate } from "react-router-dom";

import LeaderSidebar
    from "../components/LeaderSidebar";

import "../css/LeaderDashboard.css";


function LeaderDashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    return (
        <div className="leader-dashboard-layout">

            <LeaderSidebar />


            <main className="leader-dashboard-main">

                <header className="leader-dashboard-header">

                    <div>

                        <h1>
                            IT Team Lead Dashboard
                        </h1>

                        <p>
                            Welcome back,{" "}
                            <strong>
                                {user?.fullName ||
                                    "IT Team Lead"}
                            </strong>
                            .
                        </p>

                    </div>

                </header>


                <div className="leader-dashboard-content">

                    <section className="leader-dashboard-welcome-card">

                        <div className="leader-dashboard-welcome-icon">

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
                                IT Group Requests
                            </h2>

                            <p>
                                Review requests transferred to your IT group
                                and assign them to suitable IT Staff members.
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/leader/requests"
                                )
                            }
                        >
                            View Group Requests
                        </button>

                    </section>


                    <section className="leader-dashboard-info-grid">

                        <div className="leader-dashboard-info-card">

                            <div className="leader-dashboard-info-label">
                                Your Role
                            </div>

                            <div className="leader-dashboard-info-value">
                                IT Team Lead
                            </div>

                            <p>
                                Coordinate technical workload and assign
                                support requests within your IT group.
                            </p>

                        </div>


                        <div className="leader-dashboard-info-card">

                            <div className="leader-dashboard-info-label">
                                Assignment
                            </div>

                            <div className="leader-dashboard-info-value">
                                Group → IT Staff
                            </div>

                            <p>
                                Assign requests waiting for IT assignment
                                to an appropriate IT Staff member.
                            </p>

                        </div>


                        <div className="leader-dashboard-info-card">

                            <div className="leader-dashboard-info-label">
                                Team
                            </div>

                            <div className="leader-dashboard-info-value">
                                IT Group Members
                            </div>

                            <p>
                                Review the Leader and IT Staff members
                                assigned to your IT group.
                            </p>

                        </div>

                    </section>


                    <section className="leader-dashboard-team-card">

                        <div>

                            <h2>
                                IT Group Members
                            </h2>

                            <p>
                                View the members and roles configured
                                for your IT group.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/leader/team"
                                )
                            }
                        >
                            View Team
                        </button>

                    </section>

                </div>

            </main>

        </div>
    );
}


export default LeaderDashboard;