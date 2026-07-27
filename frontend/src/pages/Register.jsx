import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";


function Register() {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };


  const handleRegister = async () => {

    if (formData.password !== formData.confirmPassword) {

      alert("Passwords do not match");
      return;

    }


    try {

      await API.post("/users/register", {

        username: formData.username,
        email: formData.email,
        password: formData.password

      });


      alert("Account created successfully!");


      navigate("/");


    } catch (error) {

      alert(
        error.response?.data?.detail ||
        "Registration failed"
      );

    }

  };


  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 flex items-center justify-center">


      <div className="bg-white/20 backdrop-blur-lg border border-white/30 p-10 rounded-3xl shadow-2xl w-full max-w-md">


        <h1 className="text-5xl font-bold text-white text-center mb-3">
          PricePilot AI
        </h1>


        <p className="text-blue-100 text-center mb-8">
          Create your AI pricing account
        </p>



        <div className="space-y-5">


          <input

            name="username"
            type="text"
            placeholder="Full Name"

            onChange={handleChange}

            className="w-full px-5 py-3 rounded-xl bg-white/90 outline-none focus:ring-4 focus:ring-cyan-300"

          />



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
            placeholder="Create Password"

            onChange={handleChange}

            className="w-full px-5 py-3 rounded-xl bg-white/90 outline-none focus:ring-4 focus:ring-cyan-300"

          />



          <input

            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"

            onChange={handleChange}

            className="w-full px-5 py-3 rounded-xl bg-white/90 outline-none focus:ring-4 focus:ring-cyan-300"

          />



          <button

            onClick={handleRegister}

            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg"

          >

            Register

          </button>



        </div>



        <p className="text-center text-blue-100 mt-6">

          Already have an account?


          <span

            onClick={() => navigate("/")}

            className="text-white font-semibold cursor-pointer ml-2 hover:underline"

          >

            Login

          </span>


        </p>



      </div>


    </div>

  );

}


export default Register;