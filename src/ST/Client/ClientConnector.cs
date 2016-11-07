using System;
using StoryTeller.Messages;
using StoryTeller.Remotes;
using StoryTeller.Remotes.Messaging;

namespace ST.Client
{
    public class ClientConnector : IDisposable,
        IListener<PassthroughMessage>,
        IListener<SystemRecycled>,
        IListener<SystemRecycleStarted>,
        IListener<QueueState>,
        IClientConnector
    {
        private readonly WebSocketsHandler _handler;
        private readonly string _host;

        public ClientConnector(WebSocketsHandler handler, Action<string> handleJson)
        {
            _handler = handler;

            _handler.Received = handleJson;
        }

        public string WebSocketsAddress { get; set; }

        public void SendMessageToClient(object message)
        {
            var json = JsonSerialization.ToCleanJson(message);

            // TODO -- only do this in verbose mode
            //Console.WriteLine("Sending: " + message);

#pragma warning disable 4014
            _handler.Send(json);
#pragma warning restore 4014
        }

        public void Dispose()
        {
            _handler.Dispose();
        }

        public void Receive(PassthroughMessage message)
        {
#pragma warning disable 4014
            _handler.Send(message.json);
#pragma warning restore 4014
        }


        public void Receive(QueueState message)
        {
            SendMessageToClient(message);
        }

        public void Receive(SystemRecycled message)
        {
            message.WriteSystemUsage();
            SendMessageToClient(message);
        }

        public void Receive(SystemRecycleStarted message)
        {
            SendMessageToClient(message);
        }
    }
}