using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using PlexSSO.Model.Internal;

namespace PlexSSO.Extensions
{
    public static class CliArgumentsExtensions
    {
        public static IDictionary<string, string> GetAnnotatedCliArgumentsAsDictionary(this Type type)
        {
            return type.GetAnnotatedCliArgumentsAsEnumerable()
                .SelectMany(result => result.Item2.Arguments.Select(arg => (result.Item1, arg.Item1, arg.Item2)))
                .ToDictionary(arg => arg.Item2, arg => arg.Item3);
        }

        public static IEnumerable<(PropertyInfo, CliArgument)> GetAnnotatedCliArgumentsAsEnumerable(this Type type)
        {
            return type.GetProperties()
                .Select(property => (property, (CliArgument) property.GetCustomAttribute(typeof(CliArgument))))
                .Where(result => result.Item2 != null);
        }
    }
}
