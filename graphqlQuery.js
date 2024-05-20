var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require('fs');
var _a = require('graphql-request'), gql = _a.gql, request = _a.request;
function main() {
    return __awaiter(this, void 0, void 0, function () {
        // console.log(current_timestamp);
        function extractAmountsByOriginAndTimestamp(data) {
            var amountsByOriginAndTimestamp = {};
            // Process mints
            data.mints.forEach(function (mint) {
                var origin = mint.origin;
                var timestamp = mint.blockTimestamp;
                var amount = mint.amount;
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
            data.burns.forEach(function (burn) {
                var origin = burn.origin;
                var timestamp = burn.blockTimestamp;
                var amount = burn.amount;
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
        function convertDataToCSV(data) {
            var csv = 'address, liquid_amount, liquid_period, reward_amount\n';
            for (var origin_1 in data) {
                for (var timestamp in data[origin_1]) {
                    var entry = data[origin_1][timestamp];
                    var token_supply = 1;
                    csv += "".concat(origin_1, ",").concat(entry.amount, ",").concat(entry.liquidTime, ",").concat(token_supply, "\n");
                }
            }
            var lines = csv.split('\n');
            for (var i = 1; i < lines.length - 1; i++) {
                var _a = lines[i].split(','), i_address = _a[0], i_liquid_amount = _a[1], i_liquid_period = _a[2], i_reward_amount = _a[3];
                var _b = lines[i + 1].split(','), j_address = _b[0], j_liquid_amount = _b[1], j_liquid_period = _b[2], j_reward_amount = _b[3];
                if (i_address !== j_address)
                    continue;
                lines[i] = "".concat(i_address, ",").concat(i_liquid_amount, ",").concat(parseFloat(i_liquid_period) - parseFloat(j_liquid_period), ",").concat(i_reward_amount);
                if (parseFloat(j_liquid_amount) + parseFloat(i_liquid_amount) != 0)
                    lines[i + 1] = "".concat(j_address, ",").concat(parseFloat(j_liquid_amount) + parseFloat(i_liquid_amount), ",").concat(j_liquid_period, ",").concat(j_reward_amount);
                else
                    lines.splice(i + 1, 1);
            }
            var total_supply = 10000000 * (current_timestamp - start_timestamp) / (end_timestamp - start_timestamp);
            var total_proportion = 0;
            for (var i = 1; i < lines.length - 1; i++) {
                var _c = lines[i].split(','), address = _c[0], liquid_amount = _c[1], liquid_period = _c[2], reward_amount = _c[3];
                console.log(liquid_amount, liquid_period);
                total_proportion += parseFloat(liquid_amount) * parseFloat(liquid_period) / total_supply;
            }
            console.log(total_proportion);
            for (var i = 1; i < lines.length - 1; i++) {
                var _d = lines[i].split(','), address_1 = _d[0], liquid_amount_1 = _d[1], liquid_period_1 = _d[2], reward_amount_1 = _d[3];
                lines[i] = "".concat(address_1, ",").concat(liquid_amount_1, ",").concat(parseFloat(liquid_period_1), ",").concat(parseFloat(liquid_amount_1) * parseFloat(liquid_period_1) / total_proportion);
            }
            return lines;
        }
        var endpoint, MarketWalletAddress, query, data, start_timestamp, end_timestamp, current_timestamp, amountsByOriginAndTimestamp, csvData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    endpoint = 'https://api.studio.thegraph.com/query/70383/basechain/v0.0.18';
                    MarketWalletAddress = "0x805f92bca2f609a7e82bd5c8b3e3114c2c076418";
                    query = gql(__makeTemplateObject(["\n    query {\n        mints {\n            amount\n            blockTimestamp\n            origin\n        }\n        burns {\n            amount\n            blockTimestamp\n            origin\n        }\n    }"], ["\n    query {\n        mints {\n            amount\n            blockTimestamp\n            origin\n        }\n        burns {\n            amount\n            blockTimestamp\n            origin\n        }\n    }"]));
                    return [4 /*yield*/, request(endpoint, query)
                        // Specify the file path where you want to save the text file
                        // fs.writeFileSync(`result.json`, JSON.stringify(data, null, 2))
                        // console.log(JSON.stringify(data, undefined, 2))
                    ];
                case 1:
                    data = _a.sent();
                    start_timestamp = new Date('2024-05-01').getTime() / 1000;
                    end_timestamp = new Date('2024-06-01').getTime() / 1000;
                    current_timestamp = Date.now() / 1000;
                    amountsByOriginAndTimestamp = extractAmountsByOriginAndTimestamp(data);
                    csvData = convertDataToCSV(amountsByOriginAndTimestamp).join('\n');
                    fs.writeFileSync("result.csv", csvData);
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) { return console.error(error); });
