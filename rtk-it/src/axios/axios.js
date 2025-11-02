import axios from "axios";

export const instance = axios.create({
    baseURL: "http://84.201.169.166:8080",
    timeout: 20000,
    headers: {'X-Custom-Header': 'foobar'}
});