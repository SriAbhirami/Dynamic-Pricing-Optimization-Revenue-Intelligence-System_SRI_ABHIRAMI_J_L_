import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";


function Login() {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });



  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };



  const handleLogin = async () => {

    try {

      const response = await API.post("/users/login", {

        email: formData.email,
        password: formData.password

      });



      const token = response.data.access_token;


      // Store JWT token
      localStorage.setItem("token", token);



      


      // Temporary dashboard route
      navigate("/dashboard");


    } catch (error) {


      alert(
        error.response?.data?.detail ||
        "Login failed"
      );


    }

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 flex items-center justify-center">


      <div className="bg-white/20 backdrop-blur-lg border border-white/30 p-10 rounded-3xl shadow-2xl w-full max-w-md">


        {/* Brand */}

        <h1 className="text-5xl font-bold text-white text-center mb-3">

          PricePilot AI

        </h1>



        <p className="text-blue-100 text-center mb-8">

          AI-Powered Dynamic Pricing & Revenue Intelligence

        </p>




        {/* Login Form */}

        <div className="space-y-5">


          <input

            name="email"
            type="email"

            placeholder="Email address"

            onChange={handleChange}

            className="w-full px-5 py-3 rounded-xl bg-white/90 outline-none focus:ring-4 focus:ring-cyan-300"

          />



          <input

            name="password"
            type="password"

            placeholder="Password"

            onChange={handleChange}

            className="w-full px-5 py-3 rounded-xl bg-white/90 outline-none focus:ring-4 focus:ring-cyan-300"

          />



          <button

            onClick={handleLogin}

            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg"

          >

            Login

          </button>




          <button

            onClick={() => navigate("/register")}

            className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 rounded-xl transition duration-300 shadow-lg"

          >

            Create New Account

          </button>



        </div>




        <p className="text-center text-blue-100 mt-8 text-sm">

          Powered by Artificial Intelligence & Machine Learning

        </p>



      </div>


    </div>

  );

}


export default Login;