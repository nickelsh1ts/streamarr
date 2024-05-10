using System;
using System.Collections.Generic;
using System.Linq;

namespace PlexSSO.Model.Internal
{
    public class CliArgument : Attribute
    {
        public string Identifier { get; }
        public IEnumerable<(string, string)> Arguments { get; }

        public CliArgument(params string[] arguments)
        {
            Identifier = arguments[0];
            Arguments = arguments.Select(arg => (WithPrefix(arg), Identifier));
        }

        private string WithPrefix(string arg)
        {
            if (arg.Length > 1)
            {
                return "--" + arg;
            }
            else
            {
                return "-" + arg;
            }
        }
    }
}
