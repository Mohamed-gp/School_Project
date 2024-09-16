import prisma from "../prisma/client.js";
import Chargily from "@chargily/chargily-pay";
import { configDotenv } from "dotenv";
configDotenv();

const apiSecretKey = process.env.CHARGILY_SECRET_KEY;

const client = new Chargily.ChargilyClient({
  api_key: apiSecretKey,
  mode: "test",
});

const singleHome = async (req, res) => {
  const { id } = req.params;
  const home = await prisma.home.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      Pictures: true,
    },
  });

  if (!home) {
    return res.status(404).json({ message: "Home not found", data: null });
  }

  res.json(home);
};

// const addReservation = async (req, res) => {
//   const userId = req.user.userId;
//   const homeId = req.params.id;

//   let { checkIn, checkOut } = req.body;
//   checkIn = new Date(checkIn);
//   checkOut = new Date(checkOut);

//   if (checkIn > checkOut) {
//     return res
//       .status(400)
//       .send("Check out date must be greater than check in date");
//   }
//   if (checkIn < new Date()) {
//     return res.status(400).send("Check in date must be greater than today");
//   }

//   const home = await prisma.home.findUnique({
//     where: {
//       id: parseInt(homeId),
//     },
//   });

//   if (!home) {
//     return res.status(404).send("Home not found");
//   }
//   //check if the there is a reservation with the sattus accepted in the same date
//   const hasReserved = await prisma.reservation.findFirst({
//     where: {
//       homeId: parseInt(homeId),
//       status: "accepted",
//       startDate: {
//         lte: checkOut,
//       },
//       endDate: {
//         gte: checkIn,
//       },
//     },
//   });
//   if (hasReserved) {
//     return res.status(400).send("This home is already reserved in this date");
//   }
//   const reservation = await prisma.reservation.create({
//     data: {
//       startDate: new Date(checkIn),
//       endDate: new Date(checkOut),
//       User: {
//         connect: {
//           id: userId,
//         },
//       },
//       Home: {
//         connect: {
//           id: parseInt(homeId),
//         },
//       },
//     },
//   });
//   res.json(reservation);
// };
const addReservation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const homeId = req.params.id;

    let { checkIn, checkOut } = req.body;
    checkIn = new Date(checkIn);
    checkOut = new Date(checkOut);

    if (checkIn > checkOut) {
      return res.status(400).json({
        data: null,
        message: "Check out date must be greater than check in date",
      });
    }
    if (checkIn < new Date()) {
      return res.status(400).json({
        message: "Check in date must be greater than today",
        data: null,
      });
    }

    const home = await prisma.home.findUnique({
      where: {
        id: parseInt(homeId),
      },
    });

    if (!home) {
      return res.status(404).json({ message: "Home not found", data: null });
    }
    //check if the there is a reservation with the sattus accepted in the same date
    const hasReserved = await prisma.reservation.findFirst({
      where: {
        homeId: parseInt(homeId),
        status: "paid",
        startDate: {
          lte: checkOut,
        },
        endDate: {
          gte: checkIn,
        },
      },
    });
    console.log(hasReserved);
    if (hasReserved) {
      return res.status(400).json({
        message: "This home is already reserved in this date",
        data: null,
      });
    }
    const reservation = await prisma.reservation.create({
      data: {
        startDate: checkIn,
        endDate: checkOut,
        User: {
          connect: {
            id: userId,
          },
        },
        Home: {
          connect: {
            id: parseInt(homeId),
          },
        },
      },
    });
    // calculate how many days the user will stay
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const newCheckout = await client.createCheckout({
      amount: home.price * days,
      currency: "dzd",
      success_url: "https://krelli.onrender.com/chargily/success",
      failure_url: "https://krelli.onrender.com/chargily/failure",
      metadata: [{ reservationId: reservation.id }],
    });

    res.json({
      message: "Reservation successfully created",
      url: newCheckout.checkout_url,
    });
  } catch (error) {
    res.status(400).json({ data: null, message: "Internal Server Error" });
  }
};

const createChat = async (req, res) => {
  const userId = req.user.userId;
  const homeId = req.params.id;
  const house = await prisma.home.findUnique({
    where: {
      id: parseInt(homeId),
    },
  });

  // Check if a chat already exists between the users
  const existingChat = await prisma.chat.findFirst({
    where: {
      AND: [
        { users: { some: { id: userId } } },
        { users: { some: { id: house.userId } } },
      ],
    },
  });

  if (existingChat) {
    // Return existing chat if found
    return res.status(400).json({ message: "chat Already Exist", data: null });
  }

  const home = await prisma.home.findUnique({
    where: {
      id: parseInt(homeId),
    },
    include: {
      Pictures: {
        select: {
          url: true,
        },
      },
    },
  });
  if (!home) {
    return res.status(404).json({ message: "Home not found", data: null });
  }
  const userIds = [userId, home.userId];

  const chat = await prisma.chat.create({
    data: {
      users: {
        connect: userIds.map((id) => ({ id })),
      },
      picture: home.Pictures[0]?.url,
    },
  });

  res.json(chat);
};

const searchHomes = async (req, res) => {
  const { longitude, latitude, guests, checkIn, checkOut, category } =
    req.query;

  const homes = await prisma.home.findMany({
    where: {
      longitude: longitude ? parseFloat(longitude) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      category: category ? category : undefined,
      // guests: {
      //   gte: parseInt(guests) ? guests : undefined,
      // },

      // Reservations: {
      //   none: {
      //     startDate: {
      //       lte: new Date(checkOut) ? checkOut : undefined,
      //     },
      //     endDate: {
      //       gte: new Date(checkIn) ? checkIn : undefined,
      //     },
      //   },
      // },
    },
    include: {
      Pictures: {
        select: {
          url: true,
        },
      },
    },
  });
  res.json({ data: homes, message: "fetched successfully" });
};

const homePictures = async (req, res) => {
  const { id } = req.params;
  const home = await prisma.home.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      Pictures: true,
    },
  });
  if (!home) {
    return res.status(404).json({ message: "Home not found", data: null });
  }
  res.json(home.Pictures);
};

const deleteReview = async (req, res) => {
  const review = await prisma.review.delete({
    where: {
      id: req.params.id,
    },
  });
  if (!review) {
    return res
      .status(404)
      .json({ message: "Review Does Not Exist", data: null });
  }
  return res.status(200).json({ message: "Deleted Successfully", data: null });
};

const addReview = async (req, res) => {
  const userId = req.user.userId;
  const homeId = req.params.id;
  const { rating, comment } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found", data: null });
  }
  const hasReserved = await prisma.reservation.findFirst({
    where: {
      userId,
      homeId: parseInt(homeId),
      status: "paid",
    },
  });
  console.log({
    userId,
    homeId: parseInt(homeId),
    status: "paid",
  });
  console.log(hasReserved);
  if (!hasReserved) {
    return res
      .status(400)
      .json({ message: "You must reserve this home first", data: null });
  }
  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      userId,
      homeId: parseInt(homeId),
    },
  });
  //calculate the average rating of the home
  const reviews = await prisma.review.findMany({
    where: {
      homeId: parseInt(homeId),
    },
  });
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  await prisma.home.update({
    where: {
      id: parseInt(homeId),
    },
    data: {
      rating: averageRating,
    },
  });

  res.json(review);
};

const allReviews = async (req, res) => {
  const { id } = req.params;
  const reviews = await prisma.review.findMany({
    where: {
      homeId: parseInt(id),
    },
    select: {
      comment: true,
      id: true,
      rating: true,
      User: {
        select: {
          profileImage: true,
          username: true,
          createdAT: true,
          id: true,
        },
      },
    },
  });

  res.json(reviews);
};

export {
  singleHome,
  searchHomes,
  addReservation,
  homePictures,
  addReview,
  allReviews,
  createChat,
  deleteReview,
};
