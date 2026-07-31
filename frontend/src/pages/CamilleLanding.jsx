import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import axios from "axios";

import "./CamilleLanding.css";


const API_URL =
  import.meta.env.VITE_API_URL;


function CamilleLanding() {

  const {
    code
  } = useParams();

  const navigate =
    useNavigate();


  const [
    interest,
    setInterest
  ] = useState("");


  const [
    submitted,
    setSubmitted
  ] = useState(false);


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {

    axios.get(
      `${API_URL}/referrals/${code}/visit/`,
      {
        withCredentials: true
      }
    )
    .catch(() => {

      setError(
        "This referral link is no longer active."
      );

    });

  }, [code]);


  const handleSubmit = async (event) => {

    event.preventDefault();

    setLoading(true);
    setError("");


    const form =
      new FormData(event.target);


    const data = {

      first_name:
        form.get("first_name"),

      last_name:
        form.get("last_name"),

      email:
        form.get("email"),

      phone:
        form.get("phone"),

      interest_type:
        interest,

      inquiry_message:
        form.get("inquiry_message") || ""

    };


    try {

      await axios.post(

        `${API_URL}/leads/`,

        data,

        {
          withCredentials: true
        }

      );


        if (interest === "FASHIONHUB") {

            window.location.href =
            "https://alpha.ananse.com/fashionhub";

        } else {

            setSubmitted(true);

        }


    } catch (err) {

      setError(
        err.response?.data?.error ||
        "Something went wrong. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  if (submitted) {

    return (

      <div className="success-page">

        <h1>
          Thank you.
        </h1>

        <p>
          We've received your request
          and will be in touch with you shortly.
        </p>

        <button
          onClick={() =>
            navigate("/thank-you")
          }
        >
          Continue
        </button>

      </div>

    );

  }


  return (

    <main className="landing-page">


      <header className="landing-header">

        <div className="logo">
          ananse
          <span>
            AFRICA
          </span>
        </div>

      </header>


      <section className="hero">

        <div className="hero-content">

          <p className="eyebrow">
            ANANSE AFRICA
          </p>

          <h1>
            Bringing Africa
            <br />
            to the world.
          </h1>

          <p className="hero-text">

            Discover fashion, design,
            creative services, and bespoke
            opportunities from across Africa.

          </p>

        </div>

      </section>


      <section className="form-section">

        <div className="form-container">

          <p className="eyebrow">
            LET'S CONNECT
          </p>

          <h2>
            Tell us what you're looking for.
          </h2>

          <p>

            Whether you're looking to explore
            FashionHub or need something more
            bespoke, tell us a little about yourself.

          </p>


          <form
            onSubmit={handleSubmit}
          >


            <div className="form-grid">

              <input
                name="first_name"
                placeholder="First name *"
                required
              />

              <input
                name="last_name"
                placeholder="Last name"
              />

            </div>


            <input
              name="email"
              type="email"
              placeholder="Email address *"
              required
            />


            <input
              name="phone"
              placeholder="Phone number *"
              required
            />


            <div className="interest-options">

              <button
                type="button"
                className={
                  interest === "FASHIONHUB"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setInterest("FASHIONHUB")
                }
              >

                I want to explore
                FashionHub

              </button>


              <button
                type="button"
                className={
                  interest === "CUSTOM_INQUIRY"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setInterest("CUSTOM_INQUIRY")
                }
              >

                I have a custom request

              </button>

            </div>


            {interest === "CUSTOM_INQUIRY" && (

              <textarea
                name="inquiry_message"
                placeholder="Tell us about what you're looking for..."
                rows="6"
                required
              />

            )}


            {error && (

              <p className="error">
                {error}
              </p>

            )}


            <button
              className="submit-button"
              type="submit"
              disabled={
                loading ||
                !interest
              }
            >

              {loading
                ? "Sending..."
                : "Continue"
              }

            </button>


          </form>

        </div>

      </section>


    </main>

  );

}


export default CamilleLanding;