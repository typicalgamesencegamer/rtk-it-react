import { useState } from "react";
import { Outlet } from "react-router";
import { Navigate } from "react-router";
import { useAuth } from "../hook/hooks";

function PrivateRoute() {
    const auth = true;
    return (
        auth ? <Outlet /> : <Navigate to='login' />
    );
};

export default PrivateRoute;