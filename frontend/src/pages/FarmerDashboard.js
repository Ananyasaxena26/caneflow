import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import api from "../services/api";

import "../styles/FarmerDashboard.css";

function FarmerDashboard() {

    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);

    const [loading, setLoading] = useState(true);
    const [connection, setConnection] = useState(socket.connected ? "online" : "offline");

    const loadDashboard = async () => {

        try {

            setLoading(true);

            const response =
                await api.get("/farmer-dashboard");

            setDashboard(response.data.data);

        }

        catch (error) {

            console.log(error);

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadDashboard();

        const sync = () => loadDashboard();
        const onConnect = () => { setConnection("online"); sync(); };
        const onDisconnect = () => setConnection("offline");
        const onConnectError = () => setConnection("offline");
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);
        socket.on("queueUpdated", sync);
        socket.on("dashboardUpdated", sync);
        const poll = setInterval(() => {
            if (!socket.connected) sync();
        }, 15000);

        return () => {

            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            socket.off("queueUpdated", sync);
            socket.off("dashboardUpdated", sync);
            clearInterval(poll);

        };

    }, []);

    const logout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/login");

    };

    if (loading) {

        return (

            <div className="dashboard-container">

                <h2>

                    Loading...

                </h2>

            </div>

        );

    }

    return (

        <div className="dashboard-container">

            <div className="dashboard-card">

                <h1>

                    Farmer Dashboard

                </h1>

                <p>{connection === "online" ? "Live updates connected" : "Offline — retrying and using manual refresh"}</p>

                <div className="dashboard-info">

                    <p>

                        <strong>

                            Farmer :

                        </strong>

                        {dashboard?.farmerName}

                    </p>

                    <p>

                        <strong>

                            Token Number :

                        </strong>

                        {dashboard?.tokenNumber}

                    </p>

                    <p>

                        <strong>

                            Service Date :

                        </strong>

                        {dashboard?.serviceDate}

                    </p>

                    <p>

                        <strong>

                            Current Token :

                        </strong>

                        {dashboard?.currentToken ?? "-"}

                    </p>

                    <p>

                        <strong>

                            Vehicles Ahead :

                        </strong>

                        {dashboard?.ahead ?? "-"}

                    </p>

                    <p>

                        <strong>

                            Estimated Wait :

                        </strong>

                        {dashboard?.etaMinutes ?? "-"}

                        {" "}minutes

                    </p>

                    <p>

                        <strong>

                            Status :

                        </strong>

                        {dashboard?.status}

                    </p>

                    <p>

                        <strong>

                            Message :

                        </strong>

                        {dashboard?.message}

                    </p>

                </div>

                <button
                    onClick={loadDashboard}
                >

                    Refresh

                </button>

                <button
                    onClick={logout}
                >

                    Logout

                </button>

            </div>

        </div>

    );

}

export default FarmerDashboard;
