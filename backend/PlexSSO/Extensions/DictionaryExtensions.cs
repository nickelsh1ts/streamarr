using System;
using System.Collections.Generic;

namespace PlexSSO.Extensions
{
    public static class DictionaryExtensions
    {
        public static V GetOrDefault<K, V>(this IDictionary<K, V> dictionary, K key, V defaultValue = default)
        {
            if (dictionary == null || key == null)
            {
                throw new ArgumentNullException();
            }

            return dictionary.TryGetValue(key, out var value) ? value : defaultValue;
        }
    }
}
