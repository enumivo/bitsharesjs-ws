import assert from "assert";
import { Manager, Apis } from "../lib";

var defaultUrl = "wss://dex.eidos.one";

var faultyNodeList = [
    {url: "wss://bitsqsdqsdhares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://bitazdazdshares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://bitshaazdzares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://bit.btzadazdsabc.org/ws", location: "Hong Kong"},
    {url: "ws://127.0.0.1:8091", location: "Hangzhou, China"},
    {url: "wss://dex1.eidos.one", location: "Nuremberg, Germany"},
    {url: "wss://dex.eidos.one", location: "Main"},
    {url: "wss://dex2.eidos.one", location: "Public Testnet Server (Frankfurt, Germany)"},
    {url: "ws://dex.eidos.one:8090", location: "Main"}
];

var noWorkingNodes = [
    {url: "wss://bitsqsdqsdhares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://bitazdazdshares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://bitshaazdzares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://bit.btzadazdsabc.org/ws", location: "Hong Kong"},
    {url: "ws://127.23230.0.1:8091", location: "Hangzhou, China"},
    {url: "wss://bitshasdares.dacplay.org:8089/ws", location:  "Hangzhou, China"},
    {url: "wss://secuasdre.freedomledger.com/ws", location: "Toronto, Canada"}
];

var goodNodeList = [
    {url: "wss://dex.eidos.one", location: "Main"}
];

var fullNodeList = [
    {
        url: "wss://fake.automatic-selection.com",
        location: {translate: "settings.api_closest"}
    },
    {url: "ws://127.0.0.1:8090", location: "Locally hosted"},
    {url: "wss://dex.eidos.one", location: "Main"}
]


/* This node currently throws an API error for the crypto API */
var failedInitNodes = [
    {url: "wss://bitshares.crypto.fans/ws", location: "Munich"}
];

describe("Connection Manager", function() {

    afterEach(function() {
        return new Promise(function(res) {
            Manager.close().then(res);
        })
    });

    it("Instantiates", function() {
        let man = new Manager({url: defaultUrl, urls: faultyNodeList.map(a => a.url)});
        assert.equal(man.url, defaultUrl);
    });

    it("Instantiates with crypto api", function() {
        let man = new Manager({url: "wss://dex.eidos.one", urls: [], optionalApis: {enableCrypto: true}});
        return new Promise( function(resolve, reject) {
            man.connect().then(() => {
                assert(!!Apis.instance().crypto_api());
                resolve();
            })
        });
    });

    it("Instantiates with orders api", function() {
        let man = new Manager({url: "wss://dex.eidos.one", urls: [], optionalApis: {enableCrypto: true, enableOrders: true}});
        return new Promise( function(resolve, reject) {
            man.connect().then(() => {
                assert(!!Apis.instance().orders_api());
                resolve();
            })
        });
    });

    it("Tries to connect default url", function() {
        this.timeout(3000);
        let man = new Manager({url: defaultUrl, urls: faultyNodeList.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.connect().then(resolve)
            .catch(reject)
        });
    });

    it("Tries to connect to fallback and updates current url on connection success", function() {
        this.timeout(15000);
        let man = new Manager({url: "ws://127.0.0.1:8092", urls: faultyNodeList.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(function() {
                assert.equal(man.url, "wss://dex.eidos.one");
                resolve();
            })
            .catch(reject)
        });
    });

    it("Tries to connect to fallback and can call a callback when falling back to new url", function() {
        this.timeout(15000);
        let url = "ws://127.0.0.1:8092";
        let callbackCalled = false;
        let urlChangeCallback = function(newUrl) {
            callbackCalled = !!newUrl;
        }
        let man = new Manager({url , urls: faultyNodeList.map(a => a.url), urlChangeCallback});
        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(function() {
                assert(callbackCalled);
                resolve();
            })
            .catch(reject)
        });
    });

    it("Rejects if no connections are successful ", function() {
        this.timeout(15000);
        let man = new Manager({url: "ws://127.0.0.1:8092", urls: noWorkingNodes.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(reject)
            .catch(resolve);
        });
    });

    it("Can automatically fallback when closed", function() {
        this.timeout(20000);
        let man = new Manager({
            url: "wss://eu.nodes.bitshares.ws",
            urls: ([
                "wss://eu.nodes.bitshares.ws",
                "wss://bitshares.openledger.info/ws"
            ]),
            autoFallback: true
        });

        return new Promise( function(resolve, reject) {
            man.connectWithFallback().then(function() {
                // Assign faulty url to simulate faulty connection
                man.url = faultyNodeList[0].url;
                Apis.instance().ws_rpc.ws.close();
                setTimeout(function() {
                    if (man.isConnected) {
                        resolve();
                        /* Set autoFallback to false here to prevent permanent reconnections*/
                        man.autoFallback = false;
                    }
                    else reject();
                }, 2000);
            });
        });
    });

    it("Can call a fallbackCb when closed", function() {
        this.timeout(20000);
        return new Promise( function(resolve, reject) {

        let man = new Manager({
            url: "wss://eu.nodes.bitshares.ws",
            urls: ([
                "wss://eu.nodes.bitshares.ws",
                "wss://eu.openledger.info/ws"
            ]),
            closeCb: function() {
                resolve();
            }
        });

            man.connectWithFallback().then(function() {
                Apis.instance().ws_rpc.ws.close();
            });
        });
    })

    it("Can check connection times for all connections", function() {
        this.timeout(20000);
        let man = new Manager({url: "ws://127.0.0.1:8090", urls: fullNodeList.map(a => a.url)});
        return new Promise( function(resolve, reject) {
            man.checkConnections().then((latencies => {
                resolve();
            })).catch(reject);
        });
    });

    /*
    it("Checks connections for url and urls", function() {
        this.timeout(20000);
        let man = new Manager({url: "ws://dex.eidos.one:11011", urls: ["wss://dex.eidos.one","wss://dex.eidos.one"]});
        return new Promise( function(resolve, reject) {
            man.checkConnections().then((latencies => {
                assert.equal(Object.keys(latencies).length, 2);
                resolve();
            })).catch(reject);
        });
    });
    */

});
