// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

// function VerifyTicket() {

//   const { bookingId } = useParams();
//   const [booking, setBooking] = useState(null);

//   useEffect(() => {

//     axios
//       .get(`http://localhost:5000/api/bookings/${bookingId}`)
//       .then(res => setBooking(res.data))
//       .catch(() => alert("Invalid Ticket"));

//   }, [bookingId]);

//   if (!booking) return <p>Loading ticket...</p>;

//   return (
//     <div className="bg-black min-h-screen text-white p-8 flex justify-center">

//       <div className="bg-gray-900 p-8 rounded-xl w-[400px]">

//         <h1 className="text-2xl font-bold mb-6 text-center">
//            Ticket Verified
//         </h1>

//         {/* Movie */}
//         <img
//           src={booking.showId?.movieId?.poster}
//           alt="poster"
//           className="w-full h-60 object-cover rounded mb-4"
//         />

//         <h2 className="text-xl font-semibold">
//           {booking.showId?.movieId?.title}
//         </h2>

//         <p className="text-gray-400">
//           {booking.showId?.movieId?.genre}
//         </p>

//         {/* Theatre */}
//         <p className="mt-3">
//            Theatre: {booking.showId?.theatre}
//         </p>

//         {/* Date */}
//         <p>
//            {booking.showId?.date}
//         </p>

//         {/* Time */}
//         <p>
//            {booking.showId?.time}
//         </p>

//         {/* Seats */}
//         <p className="mt-3">
//            Seats: {booking.seats.join(", ")}
//         </p>

//         {/* Snacks */}
//         <p className="mt-3">
//            Snacks:
//           {booking.snacks?.length > 0
//             ? booking.snacks.map(s => ` ${s.name} x${s.qty}`).join(", ")
//             : " None"}
//         </p>

//         {/* Parking */}
//         <p className="mt-3">
//            Parking: {booking.parking?.type || "None"}
//         </p>

//         {/* Amount */}
//         <p className="text-red-500 font-bold mt-4">
//           ₹ {booking.totalPrice}
//         </p>

//       </div>

//     </div>
//   );
// }

// export default VerifyTicket;






// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

// function VerifyTicket() {

//   const { id } = useParams();
//   const [booking, setBooking] = useState(undefined);

//   useEffect(() => {

//     axios
//       .get(`http://10.131.192.148:5000/api/bookings/verify/${id}`)
//       .then(res => {
//         console.log("Booking Response:", res.data);
//         setBooking(res.data);
//       })
//       .catch(() => setBooking(null));

//   }, [id]);

//   // Loading
//   if (booking === undefined) return <h2>Loading ticket...</h2>;

//   // If booking not found
//   if (!booking) return <h2>Ticket Not Found</h2>;

//   return (
//     <div style={{ padding: 20 }}>

//       <h1>🎟 Ticket Details</h1>

//       <h2>{booking.showId?.movieId?.title}</h2>

//       <p> Theatre: {booking.showId?.theatre}</p>
//       <p> Date: {booking.showId?.date}</p>
//       <p> Time: {booking.showId?.time}</p>

//       <p> Seats: {booking.seats?.join(", ")}</p>

//       <p>
//          Snacks:
//         {booking.snacks?.length
//           ? booking.snacks.map(s => `${s.name} x${s.qty}`).join(", ")
//           : "None"}
//       </p>

//       <p> Parking: {booking.parking?.type || "None"}</p>

//       <h3>₹ {booking.totalPrice}</h3>

//     </div>
//   );
// }

// export default VerifyTicket;








// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

// function VerifyTicket() {

//   const { id } = useParams();

//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {

//     axios
//       .get(`http://10.131.192.148:5000/api/bookings/verify/${id}`)
//       .then(res => {
//         console.log("Booking Response:", res.data);
//         setBooking(res.data);
//       })
//       .catch(err => {
//         console.log("Verify Error:", err);
//         setBooking(null);
//       })
//       .finally(() => setLoading(false));

//   }, [id]);

//   //  Proper loading state
//   if (loading) return <h2 style={{ padding: 20 }}>Loading ticket...</h2>;

//   //  If booking missing
//   if (!booking) return <h2 style={{ padding: 20 }}>Ticket Not Found</h2>;

//   return (
//     <div style={{ padding: 20 }}>

//       <h1>🎟 Ticket Details</h1>

//       {/* Poster */}
//       <img
//         src={booking.showId?.movieId?.poster}
//         alt="poster"
//         style={{ width: 200, borderRadius: 10 }}
//       />

//       <h2>{booking.showId?.movieId?.title}</h2>

//       <p> Theatre: {booking.showId?.theatre}</p>
//       <p> Date: {booking.showId?.date}</p>
//       <p> Time: {booking.showId?.time}</p>

//       <p> Seats: {booking.seats?.join(", ")}</p>

//       <p>
//          Snacks:
//         {booking.snacks?.length
//           ? booking.snacks.map(s => `${s.name} x${s.qty}`).join(", ")
//           : " None"}
//       </p>

//       <p> Parking: {booking.parking?.type || "None"}</p>

//       <h3>₹ {booking.totalPrice}</h3>

//     </div>
//   );
// }

// export default VerifyTicket;







//       WORKING CORRCT


// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

// function VerifyTicket() {

//   //const { bookingId } = useParams();
//   const { bookingId } = useParams();

//   const [booking, setBooking] = useState(undefined);

//   useEffect(() => {

//     if (!bookingId) return;
// // http://10.131.192.148:5000/api/bookings/verify/${bookingId}
// // https://pentamerous-jefferson-laudatorily.ngrok-free.dev/api/bookings/verify/${bookingId}
//     axios
//       .get(`http://10.131.192.148:5000/api/bookings/verify/${bookingId}`)
//       .then(res => {
//         console.log("Booking Response:", res.data);
//         setBooking(res.data);
//       })
//       .catch(() => setBooking(null));

//   }, [bookingId]);

//   if (booking === undefined) return <h2>Loading ticket...</h2>;

//   if (!booking) return <h2>Invalid Ticket</h2>;

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>🎟 Ticket Details</h1>

//       <h2>{booking.showId?.movieId?.title}</h2>

//       <p> Theatre: {booking.showId?.theatre}</p>
//       <p> Date: {booking.showId?.date}</p>
//       <p> Time: {booking.showId?.time}</p>

//       <p> Seats: {booking.seats?.join(", ")}</p>

//       <p>
//          Snacks:
//         {booking.snacks?.length
//           ? booking.snacks.map(s => `${s.name} x${s.qty}`).join(", ")
//           : " None"}
//       </p>

//       <p> Parking: {booking.parking?.type || "None"}</p>

//       <h3>₹ {booking.totalPrice}</h3>
//     </div>
//   );
// }

// export default VerifyTicket;















// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

// function VerifyTicket() {

//   const { bookingId } = useParams();
//   const [booking, setBooking] = useState(undefined);

//   // useEffect(() => {

//   //   if (!bookingId) return;

//   //   axios
//   //     .get(`http://10.131.192.148:5000/api/bookings/verify/${bookingId}`)
//   //     .then(res => setBooking(res.data))
//   //     .catch(() => setBooking(null));

//   // }, [bookingId]);


//   useEffect(() => {

//   if (!bookingId) return;

//   const API_URL =
//     process.env.REACT_APP_API_URL || "http://localhost:5000";

//   axios
//     .get(`${API_URL}/api/bookings/verify/${bookingId}`)
//     .then(res => setBooking(res.data))
//     .catch(err => {
//       console.log("Verify ticket error:", err);
//       setBooking(null);
//     });

// }, [bookingId]);


//   /* ---------- Loading ---------- */

//   if (booking === undefined)
//     return (
//       <div className="bg-black min-h-screen flex justify-center items-center text-white text-xl">
//         Loading Ticket...
//       </div>
//     );

//   /* ---------- Invalid ---------- */

//   if (!booking)
//     return (
//       <div className="bg-black min-h-screen flex justify-center items-center text-red-500 text-xl">
//         Invalid Ticket
//       </div>
//     );

//   /* ---------- UI ---------- */

//   return (
//     <div className="bg-black min-h-screen flex justify-center items-center p-4">

//       <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 text-white">

//         {/* Movie Poster */}
//         <img
//           src={booking.showId?.movieId?.poster}
//           alt="poster"
//           className="w-full h-56 rounded-xl mb-4"
//         />

//         {/* Movie Name */}
//         <h1 className="text-2xl font-bold">
//           {booking.showId?.movieId?.title}
//         </h1>

//         <p className="text-gray-400 mb-4">
//           {booking.showId?.movieId?.genre}
//         </p>

//         {/* Ticket Info */}
//         <div className="space-y-2 border-t border-gray-700 pt-4">

//           <p> Theatre: <span className="text-gray-300">{booking.showId?.theatre}</span></p>

//           <p> Date: <span className="text-gray-300">{booking.showId?.date}</span></p>

//           <p> Time: <span className="text-gray-300">{booking.showId?.time}</span></p>

//           <p> Seats: <span className="text-gray-300">{booking.seats?.join(", ")}</span></p>

//           <p>
// Snacks:
// {booking.snacks?.length > 0
//   ? booking.snacks.map(s =>
//       `${s.name} x${s.qty} (₹${s.price * s.qty})`
//     ).join(", ")
//   : "None"}
// </p>


// <p>
//  Parking:
// {booking.parking
//   ? `${booking.parking.type} (₹${booking.parking.price})`
//   : "None"}
// </p>

//         </div>

//         {/* Price */}
//         <div className="border-t border-gray-700 mt-5 pt-4 text-center">

//           <h2 className="text-3xl font-bold text-red-500">
//             ₹ {booking.totalPrice}
//           </h2>

//           <p className="text-green-400 mt-1 font-semibold">
//             Payment Successful ✔
//           </p>

//         </div>

//       </div>

//     </div>
//   );
// }

// export default VerifyTicket;












import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";

function VerifyTicket() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(undefined);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      return;
    }

    const verifyTicket = async () => {
      try {
        const res = await API.get(`/api/bookings/verify/${bookingId}`);

        if (!res.data) {
          setBooking(null);
          return;
        }

        setBooking(res.data);

        if (res.data.used) {
          setStatus("USED");
        } else {
          await API.put(`/api/bookings/use/${bookingId}`);
          setStatus("VALID");
        }
      } catch (err) {
        console.log(err);
        setBooking(null);
      }
    };

    verifyTicket();
  }, [bookingId]);



  /* ---------- Loading ---------- */

  if (booking === undefined)
    return (
      <div className="bg-black min-h-screen flex justify-center items-center text-white text-xl">
        Checking Ticket...
      </div>
    );


  /* ---------- Invalid ---------- */

  if (!booking)
    return (
      <div className="bg-black min-h-screen flex justify-center items-center text-red-500 text-3xl font-bold">
         INVALID TICKET
      </div>
    );


  const snacks =
    booking.snacks?.length > 0
      ? booking.snacks
          .map(s => `${s.name} x${s.qty}`)
          .join(", ")
      : "None";

  const parking =
    booking.parking
      ? `${booking.parking.type}`
      : "None";


  return (

    <div className="bg-black min-h-screen flex justify-center items-center p-6">

      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Movie Poster */}

        <img
          src={booking.showId?.movieId?.poster}
          alt="poster"
          className="w-full h-56 object-cover"
        />


        <div className="p-6 text-white">

          {/* Movie Title */}

          <h1 className="text-2xl font-bold text-center">
            {booking.showId?.movieId?.title}
          </h1>

          <p className="text-gray-400 text-center mb-6">
            {booking.showId?.movieId?.genre}
          </p>


          {/* Ticket Divider */}

          <div className="border-t border-dashed border-gray-600 mb-6"></div>


          {/* Ticket Info */}

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span> Theatre</span>
              <span>{booking.showId?.theatre}</span>
            </div>

            <div className="flex justify-between">
              <span> Date</span>
              <span>{booking.showId?.date}</span>
            </div>

            <div className="flex justify-between">
              <span> Time</span>
              <span>{booking.showId?.time}</span>
            </div>

            <div className="flex justify-between">
              <span> Seats</span>
              <span className="text-green-400 font-semibold">
                {booking.seats?.join(", ")}
              </span>
            </div>

            <div className="flex justify-between">
              <span> Snacks</span>
              <span>{snacks}</span>
            </div>

            <div className="flex justify-between">
              <span> Parking</span>
              <span>{parking}</span>
            </div>

          </div>


          {/* Divider */}

          <div className="border-t border-dashed border-gray-600 my-6"></div>


          {/* Price */}

          <div className="text-center">

            <p className="text-gray-400 text-sm">
              Total Amount
            </p>

            <h2 className="text-4xl font-bold text-red-500">
              ₹ {booking.totalPrice}
            </h2>

          </div>


          {/* Status */}

          <div className="mt-6 text-center">

            {status === "VALID" && (
              <div className="bg-green-600 text-white py-3 rounded-xl text-lg font-bold shadow-lg">
                 ENTRY ALLOWED
              </div>
            )}

            {status === "USED" && (
              <div className="bg-red-600 text-white py-3 rounded-xl text-lg font-bold shadow-lg">
                 TICKET ALREADY USED
              </div>
            )}

          </div>

        </div>

      </div>

    </div>

  );

}

export default VerifyTicket;