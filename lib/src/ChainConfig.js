let _this;

let ecc_config = {
    address_prefix: process.env.npm_config__graphene_ecc_default_address_prefix || "EON"
};

_this = {
    core_asset: "EON",
    address_prefix: "EON",
    expire_in_secs: 15,
    expire_in_secs_proposal: 24 * 60 * 60,
    review_in_secs_committee: 24 * 60 * 60,
    networks: {
        Eidos: {
            core_asset: "EON",
            address_prefix: "EON",
            //chain_id: "4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8"
            chain_id: "7288d4e42efa3435b99cab0a42ad5860cbdbe20011e6fd0ab251fc3ef2175271"
        }
    },

    /** Set a few properties for known chain IDs. */
    setChainId: function(chain_id) {

        let i, len, network, network_name, ref;
        ref = Object.keys(_this.networks);

        for (i = 0, len = ref.length; i < len; i++) {

            network_name = ref[i];
            network = _this.networks[network_name];

            if (network.chain_id === chain_id) {

                _this.network_name = network_name;

                if (network.address_prefix) {
                    _this.address_prefix = network.address_prefix;
                    ecc_config.address_prefix = network.address_prefix;
                }

                // console.log("INFO    Configured for", network_name, ":", network.core_asset, "\n");

                return {
                    network_name: network_name,
                    network: network
                }
            }
        }

        if (!_this.network_name) {
            console.log("Unknown chain id (this may be a testnet)", chain_id);
        }

    },

    reset: function() {
        _this.core_asset = "EON";
        _this.address_prefix = "EON";
        ecc_config.address_prefix = "EON";
        _this.expire_in_secs = 15;
        _this.expire_in_secs_proposal = 24 * 60 * 60;

        console.log("Chain config reset");
    },

    setPrefix: function(prefix = "EON") {
        _this.address_prefix = prefix;
        ecc_config.address_prefix = prefix;
    }
}

export default _this;
