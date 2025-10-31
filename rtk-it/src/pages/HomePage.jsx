import { Input, Button, LinkA } from "../components/Components";

function HomePage() {
    return (
    <>
      <h1>Home Page</h1>
      <a href="/login">Login</a>
      <a href="/dashboard">Dashboard</a>
      <a href="/history">History</a>
    </>
    )
}

export default HomePage;