using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NUnit.Framework;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;
using PlexSSO.Service.Auth;
using PlexSSO.Test.Service.Config;

namespace PlexSSO.Test.Service.Auth;

public class AuthenticationValidatorTest
{
    private ILogger<AuthenticationValidator> _mockLogger;
    private PlexSsoConfig _config;

    [SetUp]
    public void Setup()
    {
        _mockLogger = Substitute.For<ILogger<AuthenticationValidator>>();
        
        _config = new PlexSsoConfig()
        {
            ConfigFile = "/config/",
            PluginDirectory = "/app",
            PlexPreferencesFile = null,
            ServerIdentifier = new ServerIdentifier("xxxxxxxx"),
            CookieDomain = ".domain.com",
            DefaultAccessDeniedMessage =
                "Sorry, you were denied access to this page. Contact admin if you think this was an error.",
            AccessControls = new Dictionary<string, PlexSsoConfig.AccessControl[]>()
            {
                {
                    "status", new[]
                    {
                        new PlexSsoConfig.AccessControl()
                        {
                            Path = "/",
                            MinimumAccessTier = AccessTier.Owner,
                            ControlType = PlexSsoConfig.ControlType.Block
                        }
                    }
                }
            }
        };
    }

    [Test]
    public void Validate_WithNullServiceUri_DeniesAccess()
    {
        var validator = CreateValidator();
        var identity = new Identity(new List<Claim>());
        var serviceName = new ServiceName(_config.AccessControls.Keys.First());
        
        ServiceUri serviceUri = null;
        
        var result = validator.ValidateAuthenticationStatus(identity, serviceName, serviceUri);
        
        Assert.True(result.AccessBlocked);
        Assert.False(result.LoggedIn);
        Assert.True(result.Success);
        Assert.AreEqual(403, result.Status);
        Assert.AreEqual(AccessTier.NoAccess, result.Tier);
        Assert.AreEqual(_config.DefaultAccessDeniedMessage, result.Message);
    }
    
    [Test]
    public void Validate_WithNoAccess_ReturnsDefaultAccessDeniedMessage()
    {
        var validator = CreateValidator();
        var identity = new Identity(new List<Claim>());
        var serviceName = new ServiceName(_config.AccessControls.Keys.First());
        var serviceUri = new ServiceUri("/");
        
        var result = validator.ValidateAuthenticationStatus(identity, serviceName, serviceUri);
        
        Assert.AreEqual(_config.DefaultAccessDeniedMessage, result.Message);
    }
    
    [Test]
    public void Validate_WithNoAccess_ReturnsCustomisedAccessDeniedMessage()
    {
        var validator = CreateValidator();
        var identity = new Identity(new List<Claim>());
        var serviceName = new ServiceName(_config.AccessControls.Keys.First());
        var serviceUri = new ServiceUri("/");

        _config.AccessControls[serviceName.Value].First().BlockMessage = "Test Access Denied Message";
        
        var result = validator.ValidateAuthenticationStatus(identity, serviceName, serviceUri);
        
        Assert.AreEqual(_config.AccessControls.Values.First().First().BlockMessage, result.Message);
    }

    private AuthenticationValidator CreateValidator()
    {
        return new AuthenticationValidator(new TestConfigurationService(_config), _mockLogger);
    }
}