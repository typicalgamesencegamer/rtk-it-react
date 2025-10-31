import { useState } from "react";
import { Outlet } from "react-router";
import { Navigate } from "react-router";
import { useAuth } from "../hook/hooks";

function PrivateRoute() {
    const auth = useAuth();
    return (
        auth ? <Outlet /> : <Navigate to='login' />
    );
};

export default PrivateRoute;