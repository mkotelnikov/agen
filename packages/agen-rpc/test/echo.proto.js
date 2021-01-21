module.exports = `
// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

syntax = "proto3";

package grpc.gateway.testing;

message Empty {}

message EchoRequest {
  string message = 1;
  option(description) = { b: 'qdsfqsdfj qlsdfjlqs djflqsjdfl ' };
}

message EchoResponse {
  string message = 1;
  int32 message_count = 2;
}

// Request type for server side streaming echo.
message ServerStreamingEchoRequest {
  // Message string for server streaming request.
  string message = 1;

  // The total number of messages to be generated before the server
  // closes the stream; default is 10.
  int32 message_count = 2;

  // The interval (ms) between two server messages. The server implementation
  // may enforce some minimum interval (e.g. 100ms) to avoid message overflow.
  int32 message_interval = 3;
}

// Response type for server streaming response.
message ServerStreamingEchoResponse {
  // Response message.
  string message = 1;
}

// Request type for client side streaming echo.
message ClientStreamingEchoRequest {
  // A special value "" indicates that there's no further messages.
  string message = 1;
}

// Response type for client side streaming echo.
message ClientStreamingEchoResponse {
  // Total number of client messages that have been received.
  int32 message_count = 1;
}

// A simple echo service.
service EchoService {
  // One request followed by one response
  // The server returns the client message as-is.
  rpc Echo(EchoRequest) returns (EchoResponse);

  // Sends back abort status.
  rpc EchoAbort(EchoRequest) returns (EchoResponse) {}

  // One empty request, ZERO processing, followed by one empty response
  // (minimum effort to do message serialization).
  rpc NoOp(Empty) returns (Empty);

  // One request followed by a sequence of responses (streamed download).
  // The server will return the same client message repeatedly.
  rpc ServerStreamingEcho(ServerStreamingEchoRequest)
      returns (stream ServerStreamingEchoResponse);

  // One request followed by a sequence of responses (streamed download).
  // The server abort directly.
  rpc ServerStreamingEchoAbort(ServerStreamingEchoRequest)
      returns (stream ServerStreamingEchoResponse) {}

  // A sequence of requests followed by one response (streamed upload).
  // The server returns the total number of messages as the result.
  rpc ClientStreamingEcho(stream ClientStreamingEchoRequest)
      returns (ClientStreamingEchoResponse);

  // A sequence of requests with each message echoed by the server immediately.
  // The server returns the same client messages in order.
  // E.g. this is how the speech API works.
  rpc FullDuplexEcho(stream EchoRequest) returns (stream EchoResponse);

  // A sequence of requests followed by a sequence of responses.
  // The server buffers all the client messages and then returns the same
  // client messages one by one after the client half-closes the stream.
  // This is how an image recognition API may work.
  rpc HalfDuplexEcho(stream EchoRequest) returns (stream EchoResponse) {
    option(path) = "/echo/half-duplex/:projectId";
    option(method) = "get";
  };
}

`