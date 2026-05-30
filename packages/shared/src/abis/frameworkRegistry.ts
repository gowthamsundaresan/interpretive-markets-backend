export const frameworkRegistryAbi = [
  {
    "type": "function",
    "name": "get",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "framework",
        "type": "tuple",
        "internalType": "struct IFrameworkRegistry.Framework",
        "components": [
          {
            "name": "uri",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "metadata",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "author",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "registeredAt",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRegistered",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "registered",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "register",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "uri",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "metadata",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "FrameworkRegistered",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "uri",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "author",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "metadata",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "EmptyURI",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FrameworkAlreadyRegistered",
    "inputs": [
      {
        "name": "id",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroId",
    "inputs": []
  }
] as const
