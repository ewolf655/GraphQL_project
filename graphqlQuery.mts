import fs from 'fs';
import { gql, request } from 'graphql-request';

async function main() {
  // const endpoint = 'https://api.studio.thegraph.com/query/70382/ggc-v3-subgraph/latest'
  const endpoint = 'https://api.studio.thegraph.com/query/70383/basechain/v0.0.18'

//   const query = gql`
//   query ($id: ID = "0x888DE1ec2522cB8dD0a8C0e86E240123a7dEDaeE") {
//     pools(where: { 
//       and: [
//         {
//           or: [
//             { token0: "0x4200000000000000000000000000000000000006" }, 
//             { token0: "0x4045b33f339a3027af80013fb5451fdbb01a4492" }
//           ]
//         },
//         {
//           or: [
//             { token1: "0x4200000000000000000000000000000000000006" }, 
//             { token1: "0x4045b33f339a3027af80013fb5451fdbb01a4492" },
//           ]
//         }
//       ]
//     }) {
//       mints {
//         token0 {
//           name
//         }
//         sender
//         token1 {
//           name
//         }
//         amount
//         amount0
//         amount1
//         timestamp
//         origin
//         owner
//         id
//       }
//       burns {
//         amount
//         amount0
//         amount1
//         timestamp
//         origin
//         owner
//         id
//         token0 {
//           name
//         }
//         token1 {
//           name
//         }
//         transaction {
//           blockNumber
//         }
//       }
//     }
//   }
// `;
  const query = gql`
    query {
        mints {
            amount
            blockTimestamp
            origin
        }
        burns {
            amount
            blockTimestamp
            origin
        }
    }`;
  const data = await request(endpoint, query)

// Specify the file path where you want to save the text file
  // fs.writeFileSync(`result.json`, JSON.stringify(data, null, 2))
  // console.log(JSON.stringify(data, undefined, 2))
  interface TokenInfo {
    name: string;
  }
  
  interface MintOrBurn {
    amount: number;
    blockTimestamp: number;
    origin: string;
  }
  
  interface Data {
    mints: MintOrBurn[];
    burns: MintOrBurn[];
  }
  
  interface AmountsAndTime {
    amount: number;
    liquidTime: number;
  }
  
  interface OriginTimestampKey {
    origin: string;
    blockTimestamp: string;
  }
  
  const start_timestamp = new Date('2024-05-01').getTime() / 1000;
  // console.log(start_timestamp);
  const end_timestamp = new Date('2024-06-01').getTime() / 1000;
  // console.log(end_timestamp);
  var current_timestamp = Date.now() / 1000;
  // console.log(current_timestamp);

  function extractAmountsByOriginAndTimestamp(data: Data): Record<string, Record<string, AmountsAndTime>> {
    const amountsByOriginAndTimestamp: Record<string, Record<string, AmountsAndTime>> = {};
  
      // Process mints
      data.mints.forEach(mint => {
        const origin = mint.origin;
        const timestamp = mint.blockTimestamp;
        const amount = mint.amount;
        if (amount == 0)
          return;
        if (!amountsByOriginAndTimestamp[origin]) {
          amountsByOriginAndTimestamp[origin] = {};
        }
        if (!amountsByOriginAndTimestamp[origin][timestamp]) {
          amountsByOriginAndTimestamp[origin][timestamp] = { amount: 0, liquidTime: 0};
        }
        amountsByOriginAndTimestamp[origin][timestamp].amount += mint.amount;
        amountsByOriginAndTimestamp[origin][timestamp].liquidTime = current_timestamp - timestamp;
      });
  
      // Process burns
      data.burns.forEach(burn => {
        const origin = burn.origin;
        const timestamp = burn.blockTimestamp;
        const amount = burn.amount;
        if (amount == 0)
          return;
        if (!amountsByOriginAndTimestamp[origin]) {
          amountsByOriginAndTimestamp[origin] = {};
        }
        if (!amountsByOriginAndTimestamp[origin][timestamp]) {
          amountsByOriginAndTimestamp[origin][timestamp] = { amount: 0, liquidTime: 0 };
        }
        amountsByOriginAndTimestamp[origin][timestamp].amount -= burn.amount;
        amountsByOriginAndTimestamp[origin][timestamp].liquidTime = current_timestamp - timestamp;
      });
  
    return amountsByOriginAndTimestamp;
  }
  
  const amountsByOriginAndTimestamp = extractAmountsByOriginAndTimestamp(data);
  // console.log(amountsByOriginAndTimestamp);
  
  var total_supply = 10000000 * (current_timestamp - start_timestamp) / (end_timestamp - start_timestamp)
  function convertDataToCSV(data: Record<string, Record<string, AmountsAndTime>>) {
    let csv = 'address, liquid_amount, liquid_period, reward_amount\n';
    let total_proportion = 0
    for (const origin in data) {
        for (const timestamp in data[origin]) {
            const entry = data[origin][timestamp];
            const proportion = entry.amount * entry.liquidTime / 10000000
            total_proportion += proportion
        }
    }
    for (const origin in data) {
      for (const timestamp in data[origin]) {
        const entry = data[origin][timestamp];
        const proportion = entry.amount * entry.liquidTime / 10000000
        const token_supply = proportion / total_proportion * total_supply;  
        csv += `${origin},${entry.amount},${entry.liquidTime},${token_supply}\n`;    
      }
    }
    return csv;
}

const csvData = convertDataToCSV(amountsByOriginAndTimestamp);
fs.writeFileSync(`result.csv`, csvData)
// console.log(csvData);
}

main().catch((error) => console.error(error))