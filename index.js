import axios from "axios";
import fs from "fs";
import path from "path";

import dotenv from "dotenv";

dotenv.config();

async function getGlobalFoodOrders() {
  const res = await axios.request({
    url: "https://pos.globalfoodsoft.com/pos/order/pop",
    method: "post",
    headers: {
      Authorization: "aXoY5SJEviW6jVB9g",
      Accept: "application/json",
      "Glf-Api-Version": "2",
    },
  });

  return res.data.orders;
}

function buildJobFromOrder(order) {
  return {
    job: {
      assignment_code: order.id,
      pickups: [
        {
          address: `${order.restaurant_street} ${order.restaurant_zipcode} ${order.restaurant_city}`,
          contact: {
            phone: order.restaurant_phone,
            company: order.restaurant_name,
          },
        },
      ],
      dropoffs: [
        {
          package_type: "small",
          client_reference: order.id,
          address: order.client_address,
          contact: {
            firstname: order.client_first_name,
            lastname: order.client_last_name,
            phone: order.client_phone,
            email: order.client_email,
          },
        },
      ],
    },
  };
}

const stuartAccessToken = null;

async function getStuartAccessToken() {
  if (stuartAccessToken) {
    return stuartAccessToken;
  }

  const res = await axios.request({
    url: `${process.env.STUART_API_ENDPOINT}/oauth/token`,
    method: "post",
    data: {
      client_id: process.env.STUART_CLIENT_ID,
      client_secret: process.env.STUART_SECRET_KEY,
      scope: "api",
      grant_type: "client_credentials",
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.data.access_token;
}

async function createStuartJob(job) {
  axios
    .request({
      url: `${process.env.STUART_API_ENDPOINT}/v2/jobs`,
      method: "post",
      data: job,
      headers: {
        Authorization: `Bearer ${await getStuartAccessToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
    .then((x) => console.log(x.data))
    .catch((x) => console.log(x.response.data));
}

(async function () {
  // const globalFoodOrders =
  //   JSON.parse(fs.readFileSync(path.resolve("./example.json"))).orders;
  const globalFoodOrders = await getGlobalFoodOrders();

  for (const order of globalFoodOrders) {
    const job = buildJobFromOrder(order);
    const result = createStuartJob(job);
  }
})();
