// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OracleBazaarRegistry {
    struct Provider {
        string endpoint;
        string metadataURI;
        uint256 registeredAt;
        bool active;
    }

    struct Attestation {
        address provider;
        bytes32 payloadHash;
        string uri;
        uint256 timestamp;
    }

    mapping(address => Provider) public providers;
    mapping(bytes32 => Attestation) public attestations;

    event ProviderRegistered(address indexed provider, string endpoint, string metadataURI);
    event ProviderDisabled(address indexed provider);
    event SignalAttested(bytes32 indexed signalId, address indexed provider, bytes32 payloadHash, string uri);

    error EmptyEndpoint();
    error EmptySignal();
    error DuplicateSignal(bytes32 signalId);
    error ProviderNotActive(address provider);

    function registerProvider(string calldata endpoint, string calldata metadataURI) external {
        if (bytes(endpoint).length == 0) revert EmptyEndpoint();

        providers[msg.sender] = Provider({
            endpoint: endpoint,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            active: true
        });

        emit ProviderRegistered(msg.sender, endpoint, metadataURI);
    }

    function disableProvider() external {
        providers[msg.sender].active = false;
        emit ProviderDisabled(msg.sender);
    }

    function attestSignal(bytes32 signalId, bytes32 payloadHash, string calldata uri) external {
        if (signalId == bytes32(0) || payloadHash == bytes32(0)) revert EmptySignal();
        if (attestations[signalId].timestamp != 0) revert DuplicateSignal(signalId);
        if (!providers[msg.sender].active) revert ProviderNotActive(msg.sender);

        attestations[signalId] = Attestation({
            provider: msg.sender,
            payloadHash: payloadHash,
            uri: uri,
            timestamp: block.timestamp
        });

        emit SignalAttested(signalId, msg.sender, payloadHash, uri);
    }
}
