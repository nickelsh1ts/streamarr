using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    public abstract class ValueType<T>
    {
        public T Value { get; }

        public ValueType(in T token)
        {
            if (token == null)
            {
                throw new ArgumentException("Provided argument cannot be null");
            }
            Value = token;
        }

        public override bool Equals(object obj)
        {
            var other = obj as ValueType<T>;
            if (other != null)
            {
                return Value.Equals(other.Value);
            }
            return Value.Equals(obj);
        }

        public static bool operator ==(ValueType<T> a, ValueType<T> b)
        {
            return a?.Equals(b) ?? ReferenceEquals(b, null);
        }

        public static bool operator !=(ValueType<T> a, ValueType<T> b)
        {
            return !(a == b);
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public override string ToString()
        {
            return Value.ToString();
        }
    }

    public class ValueTypeConverter<T, Q> : JsonConverter<Q> where Q : ValueType<T>
    {
        public override Q Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }
            var value = JsonSerializer.Deserialize(ref reader, typeof(T), options);
            return (Q)Activator.CreateInstance(typeof(Q), value);
        }

        public override void Write(Utf8JsonWriter writer, Q valueType, JsonSerializerOptions options)
        {
            if (valueType == null)
            {
                writer.WriteNullValue();
            }
            else
            {
                JsonSerializer.Serialize(writer, valueType.Value, options);
            }
        }
    }
}
