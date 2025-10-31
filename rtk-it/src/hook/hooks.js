import { useSelector } from "react-redux";

const useAuth = () => {
    const {isLogged} = useSelector((state) => state.auth);
    return isLogged;
};

export {useAuth};