const fs = require('fs');
const { gql, request } = require('graphql-request');
async function main() {
  // const endpoint = 'https://api.studio.thegraph.com/query/70382/ggc-v3-subgraph/latest'
  const endpoint = 'https://api.studio.thegraph.com/query/70383/basechain/v0.0.18'
  const MarketWalletAddress: string = "0x805f92bca2f609a7e82bd5c8b3e3114c2c076418";
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
      if (amount == 0 || origin == MarketWalletAddress)
        return;
      if (!amountsByOriginAndTimestamp[origin]) {
        amountsByOriginAndTimestamp[origin] = {};
      }
      if (!amountsByOriginAndTimestamp[origin][timestamp]) {
        amountsByOriginAndTimestamp[origin][timestamp] = { amount: 0, liquidTime: 0 };
      }
      amountsByOriginAndTimestamp[origin][timestamp].amount += mint.amount;
      amountsByOriginAndTimestamp[origin][timestamp].liquidTime = current_timestamp - timestamp;
    });

    // Process burns
    data.burns.forEach(burn => {
      const origin = burn.origin;
      const timestamp = burn.blockTimestamp;
      const amount = burn.amount;
      if (amount == 0 || origin == MarketWalletAddress)
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
  function convertDataToCSV(data: Record<string, Record<string, AmountsAndTime>>) {
    let csv = 'address, liquid_amount, liquid_period, reward_amount\n';
    
    for (const origin in data) {
      for (const timestamp in data[origin]) { 
        const entry = data[origin][timestamp];
        const token_supply = 1;
        csv += `${origin},${entry.amount},${entry.liquidTime},${token_supply}\n`;
      }   
    }

    var lines: string[] = csv.split('\n');
    for (var i = 1; i < lines.length - 1; i ++) {
      var [i_address, i_liquid_amount, i_liquid_period, i_reward_amount] = lines[i].split(',');
      var [j_address, j_liquid_amount, j_liquid_period, j_reward_amount] = lines[i + 1].split(',');

      if (i_address !== j_address)
          continue;

      lines[i] = `${i_address},${i_liquid_amount},${parseFloat(i_liquid_period) - parseFloat(j_liquid_period)},${i_reward_amount}`;
      if (parseFloat(j_liquid_amount) + parseFloat(i_liquid_amount) != 0)
        lines[i + 1] = `${j_address},${parseFloat(j_liquid_amount) + parseFloat(i_liquid_amount)},${j_liquid_period},${j_reward_amount}`;
      else
        lines.splice(i + 1, 1);
    }
    var total_supply = 10000000 * (current_timestamp - start_timestamp) / (end_timestamp - start_timestamp)
    var total_proportion = 0;
    for (var i = 1; i < lines.length - 1; i++)  {
      var [address, liquid_amount, liquid_period, reward_amount] = lines[i].split(',');
      console.log(liquid_amount, liquid_period)
      total_proportion += parseFloat(liquid_amount) * parseFloat(liquid_period) / total_supply;
    }
    console.log(total_proportion)
    for (var i = 1; i < lines.length - 1; i++)  {
      let [address, liquid_amount, liquid_period, reward_amount] = lines[i].split(',');
      lines[i] = `${address},${liquid_amount},${parseFloat(liquid_period)},${parseFloat(liquid_amount) * parseFloat(liquid_period) / total_proportion}`;
    }

    return lines;
  }

  const csvData = convertDataToCSV(amountsByOriginAndTimestamp).join('\n');
  fs.writeFileSync(`result.csv`, csvData)
}

main().catch((error) => console.error(error))